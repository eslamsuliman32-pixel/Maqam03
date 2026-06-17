"use client";

import React from "react";
import { FlowEditor } from "./components/FlowEditor";

export default function MaqamEngine() {
  return (
    <div className="w-full h-full bg-[#090b14] overflow-y-auto custom-scrollbar">
      <FlowEditor />
    </div>
  );
}
