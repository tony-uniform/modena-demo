import React, { useRef } from 'react';
import { GetStaticPaths, GetStaticPropsContext } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { RootComponentInstance, CANVAS_DRAFT_STATE, CANVAS_PUBLISHED_STATE } from '@uniformdev/canvas';
import { enhancers } from 'lib/enhancers';
import { enhance } from '@uniformdev/canvas';
import { canvasClient } from 'lib/canvasClient';
import { Composition, Slot } from '@uniformdev/canvas-react';
import { resolveRenderer } from 'components/composableComponents';

const PreviewDevPanel = dynamic(() => import('lib/preview/PreviewDevPanel/PreviewDevPanel'));

export default function Home({
  preview,
  composition,
}: {
  preview?: boolean;
  composition: RootComponentInstance;
}) {
  const containerRef = useRef(null);

  return (
    <>
      <Head>
        <title>Modena Landing</title>
        <meta name="description" content="Modena demo page"></meta>
      </Head>
      <div ref={containerRef}>
        <Composition data={composition} resolveRenderer={resolveRenderer}>
          <Slot name="header" />
          <Slot name="content" />
          <Slot name="footer" />
        </Composition>
      </div>
      {preview && <PreviewDevPanel containerRef={containerRef} preview={preview} composition={composition} />}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const pages = await canvasClient.getCompositionList({
    skipEnhance: true,
    state: process.env.NODE_ENV === 'development' ? CANVAS_DRAFT_STATE : CANVAS_PUBLISHED_STATE,
  });
  return {
    paths: pages.compositions.map((c) => c.composition._slug!).filter((slug) => slug),
    fallback: true,
  };
};

export async function getStaticProps(context: GetStaticPropsContext) {
  const slug = context?.params?.id;
  const slugString = Array.isArray(slug) ? slug.join('/') : slug;
  const { preview } = context;
  const apiResult = await canvasClient.getCompositionBySlug({
    slug: `/${slugString}`,
    state: process.env.NODE_ENV === 'development' || preview ? CANVAS_DRAFT_STATE : CANVAS_PUBLISHED_STATE,
    skipEnhance: true,
  });

  await enhance({ composition: apiResult.composition, enhancers, context });

  return {
    props: {
      composition: apiResult.composition,
      preview: Boolean(preview),
    },
  };
}
