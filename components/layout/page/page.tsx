import React, { useMemo } from 'react';

import { DefaultSeo } from 'next-seo';
import Head from 'next/head';

interface Props {
  title: readonly string[];
  children: React.ReactNode;
  description: string;
  canonicalPath: string;
}

export const PageLayout = ({ title: titleProp, children, description, canonicalPath }: Props) => {
  const title = useMemo(() => {
    const parts = [...titleProp, 'Alxandr.me'];
    return parts.join(' | ');
  }, [titleProp]);

  const canonical = `https://alxandr.me/${canonicalPath}`;
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <DefaultSeo
        title={title}
        description={description}
        canonical={canonical}
        openGraph={{
          url: canonical,
          title,
          description,
          site_name: 'Expected Exceptions',
          locale: 'en_US',
          type: 'website',
        }}
        twitter={{
          site: '@alxandr',
          cardType: 'summary',
        }}
      />

      {children}
    </>
  );
};
