"use client";
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/** Fires a GA4 event once when the page is shown (view_item, view_item_list, search). */
export function TrackEvent({ name, params }: { name: string; params: Record<string, unknown> }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    track(name, params);
  }, [name, params]);
  return null;
}
