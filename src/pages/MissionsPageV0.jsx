import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gem, Sparkles } from 'lucide-react';
import CharacterStage from '../components/character/CharacterStage';

const missionItems = [
  { id: 1, tab: 'daily', title: '初めの一歩', description: '1回勉強する', current: 1, target: 1, rewards: { diamonds: 5, hearts: 10 } },
  { id: 2, tab: 'daily', title: '毎日コツコツ', description: '3回勉強する', current: 1, target: 3, rewards: { diamonds: 10, hearts: 15 } },
  { id: 3, tab: 'daily', title: '復習の時間', description: '復習を1回する', current: 0, target: 1, rewards: { diamonds: 8, hearts: 12 } },
  { id: 4, tab: 'daily', title: '勝利の一戦', description: '対戦で1回勝利する', current: 0, target: 1, rewards: { diamonds: 12, hearts: 16 } },
  { id: 5, tab: 'daily', title: 'デイリーコンプリート', description: 'ほかのデイリーミッションをすべて達成する', current: 1, target: 4, rewards: { diamonds: 20, hearts: 25 } },
  { id: 6, tab: 'main', title: 'おしゃべりタイム', description: 'キャラに1回話しかける', current: 0, target: 1, rewards: { diamonds: 5, hearts: 8 } },
  { id: 7, tab: 'main', title: '積み重ねの証', description: '累計で30回勉強する', current: 12, target: 30, rewards: { diamonds: 15, hearts: 18 } },
  { id: 8, tab: 'main', title: 'なかよしメモリー', description: '好感度を100まで上げる', current: 72, target: 100, rewards: { diamonds: 20, hearts: 24 } },
  { id: 9, tab: 'main', title: 'ブレインスパーク', description: '🧠を100まで集める', current: 84, target: 100, rewards: { diamonds: 18, hearts: 22 } },
  { id: 10, tab: 'event', title: '物語のつづき', description: 'ストーリーを1話読む', current: 0, target: 1, rewards: { diamonds: 12, hearts: 20 } },
  { id: 11, tab: 'event', title: 'フレンド招待', description: '友だちを1人招待する', current: 0, target: 1, rewards: { diamonds: 25, hearts: 25 } },
];

const tabs = [
  { key: 'daily', label: 'デイリー' },
  { key: 'main', label: 'メイン' },
  { key: 'event', label: '限定' },
];

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #fbf4ee 0%, #f7eee6 100%)',
    color: '#5f5364',
    fontFamily: "'Noto Sans JP', sans-serif",
  },
  shell: {
    maxWidth: '430px',
    margin: '0 auto',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #f4ded7 0%, #f9f2ec 44%, #fbf7f2 100%)',
  },
  glowA: {
    position: 'absolute',
    top: '-30px',
    right: '-20px',
    width: '150px',
    height: '150px',
    borderRadius: '999px',
    background: 'rgba(255, 205, 218, 0.42)',
    filter: 'blur(24px)',
  },
  glowB: {
    position: 'absolute',
    top: '140px',
    left: '-30px',
    width: '140px',
    height: '140px',
    borderRadius: '999px',
    background: 'rgba(203, 226, 255, 0.36)',
    filter: 'blur(28px)',
  },
  hero: {
    position: 'absolute',
    inset: 0,
    zIndex: 2,
    overflow: 'hidden',
  },
  heroAura: {
    position: 'absolute',
    left: '50%',
    bottom: '23%',
    width: '290px',
    height: '150px',
    transform: 'translateX(-50%)',
    borderRadius: '999px',
    background: 'radial-gradient(circle, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0) 74%)',
    filter: 'blur(6px)',
  },
  heroStage: {
    position: 'absolute',
    inset: '0 -28px 18% -28px',
    pointerEvents: 'none',
  },
  bottomSheet: {
    position: 'relative',
    zIndex: 4,
    marginTop: '42vh',
    height: '58vh',
    borderTopLeftRadius: '28px',
    borderTopRightRadius: '28px',
    background: 'linear-gradient(180deg, rgba(255,251,247,0.98) 0%, rgba(253,249,245,0.98) 100%)',
    borderTop: '1px solid rgba(255,255,255,0.85)',
    boxShadow: '0 -18px 40px rgba(199, 164, 155, 0.18)',
    padding: '12px 8px 16px',
    display: 'flex',
    flexDirection: 'column',
  },
  handle: {
    width: '52px',
    height: '6px',
    borderRadius: '999px',
    background: 'rgba(211, 193, 188, 0.9)',
    margin: '0 auto 10px',
  },
  noteCard: {
    borderRadius: '20px',
    background: 'linear-gradient(180deg, #fff8f4 0%, #fffdfa 100%)',
    border: '1px solid #f5e2db',
    boxShadow: '0 10px 24px rgba(221, 194, 186, 0.12)',
    padding: '12px 14px',
  },
  noteTitle: {
    fontSize: '17px',
    lineHeight: 1.2,
    fontWeight: 900,
    color: '#5f5364',
  },
  tabs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginTop: '12px',
    marginBottom: '10px',
    padding: '0 4px',
  },
  tab: {
    border: '1px solid #f0dfd9',
    borderRadius: '999px',
    padding: '10px 8px',
    background: '#fffaf7',
    color: '#aa9aa4',
    fontSize: '12px',
    fontWeight: 800,
    textAlign: 'center',
  },
  activeTab: {
    background: 'linear-gradient(135deg, #fff2f5 0%, #fff8f2 100%)',
    color: '#a8657e',
    border: '1px solid #f3d4de',
    boxShadow: '0 8px 20px rgba(236, 195, 207, 0.18)',
  },
  missionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
    padding: '0 4px 0 2px',
  },
  missionCard: {
    borderRadius: '18px',
    background: 'linear-gradient(180deg, #fffefd 0%, #fffaf7 100%)',
    border: '1px solid #f5e6df',
    boxShadow: '0 10px 22px rgba(226, 203, 195, 0.14)',
    padding: '11px',
  },
  cardHeader: {
    display: 'grid',
    gridTemplateColumns: '46px 1fr auto',
    gap: '10px',
    alignItems: 'start',
  },
  titleBlock: {
    minWidth: 0,
  },
  iconWrap: {
    width: '46px',
    height: '46px',
    borderRadius: '14px',
    background: 'linear-gradient(180deg, #f6f0ff 0%, #eef7ff 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a6bf',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)',
    fontSize: '18px',
  },
  missionTitle: {
    fontSize: '15px',
    lineHeight: 1.3,
    fontWeight: 900,
    color: '#615661',
  },
  missionDesc: {
    marginTop: '2px',
    fontSize: '12px',
    color: '#9b919c',
    fontWeight: 700,
  },
  progressBox: {
    marginTop: '8px',
    borderRadius: '14px',
    border: '1px solid #f4e4dd',
    background: '#fffaf8',
    padding: '10px',
  },
  progressHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#90858f',
    fontSize: '12px',
    fontWeight: 800,
  },
  progressTrack: {
    marginTop: '7px',
    height: '8px',
    borderRadius: '999px',
    overflow: 'hidden',
    background: '#f6e9e7',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #f2c4ce 0%, #f7dfc2 100%)',
  },
  rewardWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    justifySelf: 'end',
    flexWrap: 'wrap',
  },
  rewardChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    borderRadius: '999px',
    padding: '6px 9px',
    background: '#fff0c8',
    color: '#b0903b',
    fontSize: '11px',
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  rewardChipMint: {
    background: '#d9f3e8',
    color: '#5aa98a',
  },
  actionButton: {
    marginTop: '8px',
    width: '100%',
    border: 'none',
    borderRadius: '12px',
    padding: '10px 12px',
    background: 'linear-gradient(180deg, #e7f1fd 0%, #dcebfb 100%)',
    color: '#688bb5',
    fontSize: '14px',
    fontWeight: 900,
  },
  bottomActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.4fr',
    gap: '8px',
    marginTop: '10px',
    padding: '0 4px',
  },
  secondaryFooterButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '12px 10px',
    background: '#f7e9ed',
    color: '#ad7487',
    fontSize: '13px',
    fontWeight: 900,
  },
  primaryFooterButton: {
    border: 'none',
    borderRadius: '14px',
    padding: '12px 12px',
    background: 'linear-gradient(135deg, #8de1d6 0%, #b7f2d6 100%)',
    color: '#1d6f63',
    fontSize: '13px',
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
};

function getProgressPercent(current, target) {
  if (!target) return 0;
  return Math.min((current / target) * 100, 100);
}

export default function MissionsPageV0() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('daily');

  const visibleMissions = useMemo(
    () => missionItems.filter((mission) => mission.tab === activeTab),
    [activeTab]
  );

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.glowA} />
        <div style={styles.glowB} />

        <section style={styles.hero}>
          <div style={styles.heroAura} />
          <div style={styles.heroStage}>
            <CharacterStage
              characterId="noah"
              renderer="live2d"
              skinId="skin_casual_fall"
              pose={{ scene: 'missions' }}
              scene="missions"
              className="h-full w-full [&_.character-static-base-image]:h-[142%] [&_.character-static-base-image]:max-w-none [&_.character-static-base-image]:translate-y-4 [&_.character-static-base-image]:scale-[1.06]"
              imageStyle={{
                height: '100%',
                width: '100%',
                '--character-stage-overflow': 'visible',
              }}
              alt="ノア"
            />
          </div>
        </section>

        <section style={styles.bottomSheet}>
          <div style={styles.handle} />

          <div style={styles.noteCard}>
            <div style={styles.noteTitle}>デイリーミッション</div>
          </div>

          <div style={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={activeTab === tab.key ? { ...styles.tab, ...styles.activeTab } : styles.tab}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={styles.missionList}>
            {visibleMissions.map((mission) => {
              const progressPercent = getProgressPercent(mission.current, mission.target);
              const isClaimable = mission.current >= mission.target;

              return (
                <article key={mission.id} style={styles.missionCard}>
                  <div style={styles.cardHeader}>
                    <div style={styles.iconWrap}>📘</div>
                    <div style={styles.titleBlock}>
                      <div style={styles.missionTitle}>{mission.title}</div>
                      <div style={styles.missionDesc}>{mission.description}</div>
                    </div>
                    <div style={styles.rewardWrap}>
                      <div style={styles.rewardChip}>
                        <Gem size={13} />
                        {mission.rewards.diamonds}
                      </div>
                      <div style={{ ...styles.rewardChip, ...styles.rewardChipMint }}>
                        🧠 {mission.rewards.hearts}
                      </div>
                    </div>
                  </div>

                  <div style={styles.progressBox}>
                    <div style={styles.progressHead}>
                      <span>進行状況</span>
                      <span>{mission.current} / {mission.target}</span>
                    </div>
                    <div style={styles.progressTrack}>
                      <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <button type="button" style={styles.actionButton}>
                    {isClaimable ? '受け取る' : 'つづける'}
                  </button>
                </article>
              );
            })}
          </div>

          <div style={styles.bottomActions}>
            <button type="button" style={styles.secondaryFooterButton} onClick={() => navigate('/home')}>
              ホームへ戻る
            </button>
            <button type="button" style={styles.primaryFooterButton}>
              <Sparkles size={14} />
              全部受け取る
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
