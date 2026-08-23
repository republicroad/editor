import { ChevronLeft } from 'lucide-react';
import React from 'react';

import { Stack } from './stack.tsx';
import { Button } from './ui/button';

export type PageHeaderProps = {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  onBack?: () => void;
  extra?: React.ReactNode;
  fullPage?: boolean;
  ghost?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subTitle, extra, onBack, children, style, ...rest }) => {
  return (
    <Stack style={style} {...rest}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Stack horizontal gap={12} verticalAlign="center">
          {onBack && (
            <Button type="button" variant="ghost" size="icon" className="size-8" aria-label="返回" onClick={onBack}>
              <ChevronLeft />
            </Button>
          )}
          {title}
          {subTitle && <span className="text-sm text-muted-foreground">{subTitle}</span>}
        </Stack>
        {extra && (
          <Stack width="auto" horizontal gap={12}>
            {extra}
          </Stack>
        )}
      </Stack>
      {children}
    </Stack>
  );
};
