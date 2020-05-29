import React, { useMemo } from 'react';

import Head from 'next/head';

type Props = {
  title: readonly string[];
  children: React.ReactNode;
};

export const PageLayout = ({ title: titleProp, children }: Props) => {
  const title = useMemo(() => {
    const parts = [...titleProp, 'Alxandr.me'];
    return parts.join(' | ');
  }, [titleProp]);

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      {children}
    </>
  );
};
