import styles from './page.module.css'

export default function Home() {
  return (
      <main className={styles.main}>
        <div className={styles.description}>
          <p>
            Get started by editing:
            <code className={styles.code}> app/page.tsx</code>
          </p>
        </div>
      </main>
  )
}