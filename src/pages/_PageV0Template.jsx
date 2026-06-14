const tabs = ['タブA', 'タブB', 'タブC'];

const listItems = [
  { id: 1, title: 'カードタイトル', meta: '補足情報', action: 'ボタン' },
  { id: 2, title: 'カードタイトル', meta: '補足情報', action: 'ボタン' },
  { id: 3, title: 'カードタイトル', meta: '補足情報', action: 'ボタン' },
];

const styles = {
  page: {
    minHeight: '100vh',
    background: '#eef3f7',
    color: '#2b3440',
    fontFamily: '"BIZ UDPGothic", "Yu Gothic UI", sans-serif',
  },
  shell: {
    position: 'relative',
    maxWidth: '430px',
    minHeight: '100vh',
    margin: '0 auto',
    overflow: 'hidden',
    background: '#f6f2ee',
  },
  classroomBackdrop: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, #dfe9f2 0%, #f4ede7 42%, #f8f3ef 100%)',
  },
  classroomLabel: {
    position: 'absolute',
    top: '18px',
    left: '16px',
    padding: '6px 10px',
    border: '1px dashed rgba(43, 52, 64, 0.35)',
    borderRadius: '999px',
    background: 'rgba(255, 255, 255, 0.68)',
    fontSize: '12px',
    fontWeight: 700,
  },
  topZone: {
    position: 'relative',
    zIndex: 1,
    height: '38vh',
    minHeight: '260px',
  },
  characterFrame: {
    position: 'absolute',
    top: '52px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '220px',
    height: '190px',
    border: '2px dashed rgba(43, 52, 64, 0.28)',
    borderRadius: '28px',
    background: 'rgba(255, 255, 255, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '16px',
    fontSize: '14px',
    fontWeight: 700,
  },
  characterNote: {
    position: 'absolute',
    bottom: '20px',
    right: '16px',
    padding: '8px 10px',
    borderRadius: '14px',
    background: 'rgba(255, 255, 255, 0.82)',
    border: '1px dashed rgba(43, 52, 64, 0.28)',
    fontSize: '11px',
    fontWeight: 700,
  },
  bottomSheet: {
    position: 'relative',
    zIndex: 2,
    marginTop: '-20px',
    minHeight: '62vh',
    borderTopLeftRadius: '28px',
    borderTopRightRadius: '28px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderTop: '1px solid rgba(43, 52, 64, 0.12)',
    padding: '14px 12px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  handle: {
    width: '52px',
    height: '6px',
    borderRadius: '999px',
    background: 'rgba(43, 52, 64, 0.18)',
    margin: '0 auto',
  },
  titleBlock: {
    border: '1px dashed rgba(43, 52, 64, 0.25)',
    borderRadius: '18px',
    padding: '14px',
    background: '#fbfbfb',
  },
  title: {
    fontSize: '18px',
    fontWeight: 800,
  },
  subtitle: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#697586',
  },
  tabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  tab: {
    border: '1px dashed rgba(43, 52, 64, 0.25)',
    borderRadius: '999px',
    padding: '10px 8px',
    background: '#f7f8fa',
    fontSize: '12px',
    fontWeight: 700,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#697586',
    paddingLeft: '4px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  card: {
    border: '1px dashed rgba(43, 52, 64, 0.25)',
    borderRadius: '18px',
    background: '#ffffff',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cardHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '12px',
    alignItems: 'start',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 800,
  },
  cardMeta: {
    marginTop: '3px',
    fontSize: '12px',
    color: '#697586',
  },
  chip: {
    border: '1px dashed rgba(43, 52, 64, 0.25)',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  progress: {
    border: '1px dashed rgba(43, 52, 64, 0.2)',
    borderRadius: '14px',
    padding: '10px',
  },
  progressBar: {
    height: '8px',
    marginTop: '8px',
    borderRadius: '999px',
    background: '#e8edf2',
    overflow: 'hidden',
  },
  progressFill: {
    width: '56%',
    height: '100%',
    borderRadius: '999px',
    background: '#c5d7ea',
  },
  button: {
    border: '1px dashed rgba(43, 52, 64, 0.28)',
    borderRadius: '14px',
    padding: '11px 12px',
    background: '#f4f6f8',
    fontSize: '13px',
    fontWeight: 800,
  },
  bottomActions: {
    marginTop: 'auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1.25fr',
    gap: '8px',
  },
};

export default function PageV0Template() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.classroomBackdrop} />

        <section style={styles.topZone}>
          <div style={styles.classroomLabel}>教室背景エリア</div>
          <div style={styles.characterFrame}>
            キャラの顔 / 上半身を見せる
            <br />
            プレースホルダー
          </div>
          <div style={styles.characterNote}>上部はキャラが見える構図を維持</div>
        </section>

        <section style={styles.bottomSheet}>
          <div style={styles.handle} />

          <div style={styles.titleBlock}>
            <div style={styles.title}>ページタイトル</div>
            <div style={styles.subtitle}>状態表示・説明文・期間などを置く枠</div>
          </div>

          <div style={styles.tabs}>
            {tabs.map((tab) => (
              <div key={tab} style={styles.tab}>
                {tab}
              </div>
            ))}
          </div>

          <div style={styles.sectionLabel}>メインコンテンツ</div>

          <div style={styles.list}>
            {listItems.map((item) => (
              <article key={item.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.cardTitle}>{item.title}</div>
                    <div style={styles.cardMeta}>{item.meta}</div>
                  </div>
                  <div style={styles.chip}>補助情報</div>
                </div>

                <div style={styles.progress}>
                  進行状況や要約の枠
                  <div style={styles.progressBar}>
                    <div style={styles.progressFill} />
                  </div>
                </div>

                <button type="button" style={styles.button}>
                  {item.action}
                </button>
              </article>
            ))}
          </div>

          <div style={styles.bottomActions}>
            <button type="button" style={styles.button}>
              戻る
            </button>
            <button type="button" style={styles.button}>
              メインアクション
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
