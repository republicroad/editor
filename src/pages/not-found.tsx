import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@republicroad/jdm-appshell/src/components/ui/button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center gap-2 pt-[8%] text-center">
      <h1 className="text-6xl font-semibold tracking-tight">404</h1>
      <p className="text-sm text-muted-foreground">Sorry, the page you visited does not exist.</p>
      <Button asChild size="lg" className="mt-4">
        <Link to="/">Back</Link>
      </Button>
    </div>
  );
};
