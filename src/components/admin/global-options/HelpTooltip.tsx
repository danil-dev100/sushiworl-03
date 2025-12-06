'use client';

import { Info } from 'lucide-react';
import { useState } from 'react';

interface HelpTooltipProps {
  content: string | React.ReactNode;
}

export function HelpTooltip({ content }: HelpTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <Info
        className="w-4 h-4 text-muted-foreground cursor-help hover:text-foreground transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      />
      {show && (
        <div className="absolute left-0 top-6 z-50 w-64 rounded-md border bg-popover p-3 text-sm text-popover-foreground shadow-md">
          {content}
          <div className="absolute -top-1 left-2 h-2 w-2 rotate-45 border-l border-t bg-popover" />
        </div>
      )}
    </div>
  );
}
