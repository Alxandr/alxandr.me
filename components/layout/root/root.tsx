import React, { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import classNames from 'classnames';
import styles from './root.module.css';

type Props = {
  children: React.ReactNode;
};

type IntersectionObserverArgs = {
  target: React.RefObject<HTMLElement>;
  root?: React.RefObject<HTMLElement>;
  log?: true;
};

const useIntersectionObserver = (
  callback: (newState: boolean) => void,
  { target: targetRef, root: rootRef, log }: IntersectionObserverArgs,
) => {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<HTMLElement | null>(null);
  const callbackRef = useRef<null | ((newState: boolean) => void)>(null);
  callbackRef.current = callback;

  useEffect(() => {
    const target = targetRef.current;

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          let state: IntersectionObserverEntry | null = null;
          for (const entry of entries) {
            state = entry;
          }

          if (state) {
            if (log) console.log(state);
            callbackRef.current?.(state.isIntersecting);
          }
        },
        { root: rootRef?.current },
      );
    }

    const observer = observerRef.current;
    if (nodeRef.current !== target) {
      if (nodeRef.current) {
        observer.unobserve(nodeRef.current);
      }

      if (target) {
        console.log('observe before title');
        observer.observe(target);
      }

      nodeRef.current = target;
    }

    return () => {
      console.log('cleanup intersection observer');
      observerRef.current?.disconnect();
      observerRef.current = null;
      nodeRef.current = null;
    };
  }, [targetRef.current, rootRef?.current]);
};

export const RootLayout = ({ children }: Props) => {
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const titleEndMarkerRef = useRef<HTMLDivElement>(null);
  const [detached, setDetached] = useState(true);
  const [ready, setReady] = useState(false);

  useIntersectionObserver(
    (intersects) => {
      if (!ready) setReady(true);
      setDetached(!intersects);
    },
    { target: titleEndMarkerRef, root: titleWrapRef },
  );

  return (
    <>
      <header
        className={classNames(styles.header, {
          [styles.detached]: detached,
          [styles.notReady]: !ready,
        })}
      >
        <i className={styles.headerBg} />
        <div className={styles.titleWrap} ref={titleWrapRef}>
          <div className={styles.beforeTitle} />
          <h1 className={styles.title} itemProp="headline">
            <Link href="/" scroll={false}>
              <a href="/">Expected Exceptions</a>
            </Link>
            <p className={styles.subtitle} itemProp="alternativeHeadline">
              Code, Software, and things that interest me
            </p>
            <div className={styles.titleEndMarker} ref={titleEndMarkerRef} />
          </h1>
          <div className={styles.afterTitle} />
        </div>
      </header>
      <main
        className={classNames(styles.main, {
          [styles.notReady]: !ready,
        })}
      >
        <div className={styles.container} id="content">
          {children}
        </div>
      </main>
    </>
  );
};
