import React from 'react';
import { Gift, Gem, Calendar, Star } from 'lucide-react';
import './LoginBonusModal.css';
import { LOGIN_REWARDS } from '../utils/loginBonusUtils';

const LoginBonusModal = ({ onClose, reward, streak, totalDays, consecutive }) => {
    return (
        <div className="login-bonus-overlay" onClick={onClose}>
            <div className="login-bonus-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="login-bonus-header">
                    <Gift className="header-icon" size={32} />
                    <h2>ログインボーナス</h2>
                </div>

                {/* Streak Info */}
                <div className="streak-info">
                    <div className="streak-badge">
                        <Calendar size={20} />
                        <span>{streak}日目</span>
                    </div>
                    {consecutive && streak > 1 && (
                        <div className="consecutive-badge">
                            🔥連続ログイン！
                        </div>
                    )}
                </div>

                {/* Today's Reward */}
                <div className="reward-showcase">
                    <div className="reward-glow"></div>
                    <div className="reward-icon">
                        <Gem size={48} />
                    </div>
                    <div className="reward-text">{reward.description}</div>
                </div>

                {/* 7 Day Calendar */}
                <div className="week-calendar">
                    <h3>7日間のボーナス</h3>
                    <div className="day-grid">
                        {LOGIN_REWARDS.map((r, index) => {
                            const dayNum = index + 1;
                            const isCurrent = dayNum === ((streak - 1) % 7) + 1;
                            const isPast = dayNum < ((streak - 1) % 7) + 1;

                            return (
                                <div
                                    key={dayNum}
                                    className={`day-item ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}
                                >
                                    <div className="day-number">{dayNum}日</div>
                                    <div className="day-reward">
                                        {dayNum === 7 ? '🎁' : '💎'}
                                    </div>
                                    <div className="day-amount">
                                        {dayNum === 7 ? '×30' : `×${r.diamonds}`}
                                    </div>
                                    {isPast && <div className="check-mark">✓</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Total Days */}
                <div className="total-info">
                    <Star size={16} />
                    <span>累計ログイン日数: {totalDays}日</span>
                </div>

                {/* Close Button */}
                <button className="login-bonus-close-btn" onClick={onClose}>
                    受け取る！
                </button>
            </div>
        </div>
    );
};

export default LoginBonusModal;
