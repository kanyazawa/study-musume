import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Users, Globe, Crown, Medal, Award } from 'lucide-react';
import { getCurrentUser } from '../firebase/auth';
import { getFriendRanking, getGlobalRanking, getMyRank, formatStudyTime } from '../firebase/ranking';
import { getFriendsList } from '../firebase/friends';
import './Ranking.css';

const Ranking = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('friends'); // friends, global
    const [ranking, setRanking] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [loading, setLoading] = useState(false);
    const [friendIds, setFriendIds] = useState([]);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }
        setCurrentUser(user);
        loadFriendsData(user.uid);
    }, [navigate]);

    useEffect(() => {
        if (currentUser) {
            loadRankingData();
        }
    }, [activeTab, currentUser, friendIds]);

    const loadFriendsData = async (uid) => {
        const result = await getFriendsList(uid);
        if (result.success) {
            setFriendIds([uid, ...result.friends.map(f => f.id)]);
        }
    };

    const loadRankingData = async () => {
        setLoading(true);

        let result;
        if (activeTab === 'friends') {
            result = await getFriendRanking(friendIds);
        } else {
            result = await getGlobalRanking(50);
        }

        if (result.success) {
            setRanking(result.ranking);

            // 自分の順位を取得
            const rankResult = await getMyRank(
                currentUser.uid,
                activeTab === 'global',
                friendIds
            );
            if (rankResult.success) {
                setMyRank(rankResult.rank);
            }
        }

        setLoading(false);
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return <Crown size={24} color="#FFD700" />;
        if (rank === 2) return <Medal size={24} color="#C0C0C0" />;
        if (rank === 3) return <Award size={24} color="#CD7F32" />;
        return <span className="rank-number">#{rank}</span>;
    };

    if (!currentUser) {
        return null;
    }

    return (
        <div className="ranking-screen">
            {/* Header */}
            <div className="ranking-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>
                    <Trophy size={28} />
                    ランキング
                </h1>
            </div>

            {/* My Rank Display */}
            {myRank && (
                <div className="my-rank-display">
                    <div className="my-rank-label">あなたの順位</div>
                    <div className="my-rank-value">
                        {getRankIcon(myRank)}
                        <span className="rank-text">
                            {myRank}位 / {ranking.length}人
                        </span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="ranking-tabs">
                <button
                    className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    <Users size={18} />
                    フレンド
                </button>
                <button
                    className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
                    onClick={() => setActiveTab('global')}
                >
                    <Globe size={18} />
                    グローバル
                </button>
            </div>

            {/* Ranking List */}
            <div className="ranking-content">
                {loading ? (
                    <div className="ranking-loading">
                        <div className="loading-spinner"></div>
                        <p>読み込み中...</p>
                    </div>
                ) : ranking.length === 0 ? (
                    <div className="empty-state">
                        <Trophy size={48} />
                        {activeTab === 'friends' ? (
                            <>
                                <p>まだフレンドがいません</p>
                                <p className="hint">フレンドを追加してランキングで競おう！</p>
                            </>
                        ) : (
                            <>
                                <p>データがありません</p>
                                <p className="hint">学習を始めるとランキングに表示されます</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="ranking-list">
                        {ranking.map((user, index) => (
                            <div
                                key={user.uid}
                                className={`ranking-card ${user.uid === currentUser.uid ? 'my-card' : ''} ${index < 3 ? `top-${index + 1}` : ''}`}
                            >
                                <div className="rank-icon">
                                    {getRankIcon(index + 1)}
                                </div>

                                <div className="user-avatar">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {user.displayName?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>

                                <div className="user-info">
                                    <div className="user-name">
                                        {user.displayName}
                                        {user.uid === currentUser.uid && (
                                            <span className="you-badge">YOU</span>
                                        )}
                                    </div>
                                    <div className="user-level">Lv.{user.level}</div>
                                </div>

                                <div className="study-time">
                                    <div className="time-value">
                                        {formatStudyTime(user.totalStudyTime)}
                                    </div>
                                    <div className="time-label">学習時間</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Ranking;
