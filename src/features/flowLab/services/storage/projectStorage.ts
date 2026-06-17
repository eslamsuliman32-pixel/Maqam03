import { db, StoredProject } from './dbConfig';
import type { FlowLabState } from '../../store/types';

export class ProjectStorage {
  // حفظ مشروع
  static async saveProject(
    name: string,
    state: Pick<FlowLabState, 'textCells' | 'analysisResult' | 'activeTab'>,
    metadata: StoredProject['metadata'] = {}
  ): Promise<number> {
    const audioFingerprint = state.analysisResult 
      ? await this.generateFingerprint(state.analysisResult)
      : '';

    const project: StoredProject = {
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
      audioFingerprint,
      bpm: state.analysisResult?.globalTempo || 0,
      duration: state.analysisResult?.bars[state.analysisResult.bars.length - 1]?.endTime || 0,
      state: {
        textCells: state.textCells,
        analysisResult: state.analysisResult,
        activeTab: state.activeTab,
      },
      metadata,
    };

    return await db.projects.add(project);
  }

  // تحديث مشروع
  static async updateProject(id: number, updates: Partial<StoredProject>): Promise<void> {
    await db.projects.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  // تحميل مشروع
  static async loadProject(id: number): Promise<StoredProject | undefined> {
    return await db.projects.get(id);
  }

  // جلب كل المشاريع
  static async getAllProjects(): Promise<StoredProject[]> {
    return await db.projects.orderBy('updatedAt').reverse().toArray();
  }

  // حذف مشروع
  static async deleteProject(id: number): Promise<void> {
    await db.projects.delete(id);
  }

  // حفظ نتيجة تحليل في الكاش
  static async cacheAnalysis(fingerprint: string, analysisResult: any): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // صلاحية 7 أيام

    await db.audioCache.add({
      fingerprint,
      analysisResult,
      createdAt: new Date(),
      expiresAt,
    });
  }

  // جلب من الكاش
  static async getCachedAnalysis(fingerprint: string): Promise<any | null> {
    const cached = await db.audioCache
      .where('fingerprint')
      .equals(fingerprint)
      .first();

    if (!cached) return null;

    // التحقق من الصلاحية
    if (new Date() > cached.expiresAt) {
      await db.audioCache.delete(cached.id!);
      return null;
    }

    return cached.analysisResult;
  }

  // تنظيف الكاش المنتهي
  static async cleanExpiredCache(): Promise<void> {
    const now = new Date();
    await db.audioCache.where('expiresAt').below(now).delete();
  }

  // توليد بصمة للملف الصوتي
  static async generateFingerprint(analysisResult: any): Promise<string> {
    const data = JSON.stringify({
      tempo: analysisResult.globalTempo,
      barCount: analysisResult.bars.length,
      beatCount: analysisResult.beatGrid.length,
    });
    
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// تنظيف تلقائي عند التحميل
ProjectStorage.cleanExpiredCache();
