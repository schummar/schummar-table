import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import { ExampleTable } from '../components/exampleTable';

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/docs/getting-started">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <section>
      <h2>{title}</h2>
      <p css={{ marginBottom: 0 }}>{text}</p>
    </section>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={`Hello from ${siteConfig.title}`} description="Description will go into a meta tag in <head />">
      <HomepageHeader />

      <div css={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div
          css={{
            alignSelf: 'center',
            margin: `40px 0 80px`,
            maxWidth: 960,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 30,
          }}
        >
          <Feature title="⏱️ Simple to use" text="Get started in minutes thanks to the intuitive api and sensible defaults." />

          <Feature title="✨ Neat and tidy" text="Looks good by default but can be extensively styled if needed." />

          <Feature title="⚡️ Fast" text="Can render huge amounts of data with virtual rows enabled. No fixed row heights required!" />

          <Feature title="🔋 Batteries included" text="Builtin filters, csv export and other powerful features." />

          <Feature title="🎛️ Adjustable" text="Move, resize and hide columns. Sort by multiple rows. Drill down." />

          <Feature
            title="🤝 (Optional) Material UI"
            text="Can be integrated with @mui/material or @material-ui if desired but also stands on its own."
          />
        </div>

        <main className={styles.main}>
          <h2 css={{ justifySelf: 'center', color: 'gray', margin: '5rem 0' }}>Demo</h2>

          <ExampleTable stickyHeader={{ top: 60 }} />
        </main>
      </div>
    </Layout>
  );
}
