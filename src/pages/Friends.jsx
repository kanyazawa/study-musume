import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, UserPlus, Search, Check, X, Gift, Copy, Ticket } from 'lucide-react';
import { getCurrentUser } from '../firebase/auth';
import {
    searchUserByFriendCode,
    sendFriendRequest,
    getFriendsList,
    getPendingRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
} from '../firebase/friends';
import { getUserProfile } from '../firebase/auth';
import { createFriendRoom, subscribeToFriendInvites } from '../firebase/matching';
import { redeemReferralCode } from '../firebase/referrals';
import {
    FRIEND_MATCH_MODE_OPTIONS,
    FRIEND_MATCH_TARGET_OPTIONS,
    getBattleModeLabel,
    normalizeBattleMode,
    normalizeTargetCorrect,
} from '../utils/matchUtils';
import { DEFAULT_RATING, getLevelFromRating, LEVEL_THRESHOLDS } from '../utils/ratingUtils';
import {
    REFERRAL_REWARD,
    applyRewardToStats,
    buildReferralInviteMessage,
    getReferralSummary,
    normalizeReferralCode,
} from '../utils/referralUtils';
import './Friends.css';

const Friends = ({ stats, updateStats }) => {
    const navigate = useNavigate();
    const defaultBattleLevel = getLevelFromRating(stats?.multiplayerRating || DEFAULT_RATING).level;
    const [currentUser, setCurrentUser] = useState(null);
    const [myFriendCode, setMyFriendCode] = useState('');
    const [myDisplayName, setMyDisplayName] = useState('');
    const [profile, setProfile] = useState(null);
    const [searchCode, setSearchCode] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [referralCode, setReferralCode] = useState('');
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [battleInvites, setBattleInvites] = useState([]);
    const [selectedBattleLevel, setSelectedBattleLevel] = useState(defaultBattleLevel);
    const [selectedTargetCorrect, setSelectedTargetCorrect] = useState(10);
    const [selectedBattleMode, setSelectedBattleMode] = useState('classic');
    const [activeTab, setActiveTab] = useState('friends'); // friends, search, requests
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        setSelectedBattleLevel(defaultBattleLevel);
    }, [defaultBattleLevel]);

    const getLevelLabel = useCallback((level) => {
        return LEVEL_THRESHOLDS.find((threshold) => threshold.level === level)?.label || '英検5級';
    }, []);

    const getTargetCorrectLabel = useCallback((targetCorrect) => {
        return `${normalizeTargetCorrect(targetCorrect)}問先取`;
    }, []);

    const getBattleModeBadgeLabel = useCallback((battleMode) => {
        return getBattleModeLabel(battleMode);
    }, []);

    const showMessage = useCallback((text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    }, []);

    const loadUserData = useCallback(async (uid) => {
        setLoading(true);
        const [profileResult, friendsResult, requestsResult] = await Promise.all([
            getUserProfile(uid),
            getFriendsList(uid),
            getPendingRequests(uid)
        ]);

        if (profileResult.success) {
            setProfile(profileResult.data);
            setMyFriendCode(profileResult.data.friendCode || '');
            setMyDisplayName(profileResult.data.displayName || '');
        } else {
            showMessage(profileResult.error || 'プロフィールの取得に失敗しました', 'error');
        }

        if (friendsResult.success) {
            setFriends(friendsResult.friends);
        } else {
            showMessage(friendsResult.error || 'フレンド一覧の取得に失敗しました', 'error');
        }

        if (requestsResult.success) {
            setPendingRequests(requestsResult.requests);
        } else {
            showMessage(requestsResult.error || 'フレンド申請の取得に失敗しました', 'error');
        }

        setLoading(false);
    }, [showMessage]);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }
        setCurrentUser(user);
        loadUserData(user.uid);

        const unsubscribeInvites = subscribeToFriendInvites(user.uid, (invites) => {
            setBattleInvites(invites);
        });

        return () => {
            unsubscribeInvites?.();
        };
    }, [navigate, loadUserData]);

    const handleSearch = async () => {
        if (!searchCode.trim()) {
            showMessage('フレンドコードを入力してください', 'error');
            return;
        }

        setLoading(true);
        const result = await searchUserByFriendCode(searchCode);

        if (result.success) {
            setSearchResult(result.user);
            showMessage('ユーザーが見つかりました！', 'success');
        } else {
            setSearchResult(null);
            showMessage(result.error, 'error');
        }
        setLoading(false);
    };

    const handleSendRequest = async () => {
        if (!searchResult) return;

        setLoading(true);
        const result = await sendFriendRequest(currentUser.uid, searchResult.uid);

        if (result.success) {
            showMessage('フレンド申請を送信しました！', 'success');
            setSearchResult(null);
            setSearchCode('');
        } else {
            showMessage(result.error, 'error');
        }
        setLoading(false);
    };

    const handleAcceptRequest = async (friendshipId) => {
        setLoading(true);
        const result = await acceptFriendRequest(friendshipId);

        if (result.success) {
            showMessage('フレンド申請を承認しました！', 'success');
            loadUserData(currentUser.uid);
        } else {
            showMessage(result.error, 'error');
        }
        setLoading(false);
    };

    const handleRejectRequest = async (friendshipId) => {
        setLoading(true);
        const result = await rejectFriendRequest(friendshipId);

        if (result.success) {
            showMessage('フレンド申請を拒否しました', 'success');
            loadUserData(currentUser.uid);
        } else {
            showMessage(result.error, 'error');
        }
        setLoading(false);
    };

    const handleRemoveFriend = async (friendshipId) => {
        if (!confirm('このフレンドを削除しますか？')) return;

        setLoading(true);
        const result = await removeFriend(friendshipId);

        if (result.success) {
            showMessage('フレンドを削除しました', 'success');
            loadUserData(currentUser.uid);
        } else {
            showMessage(result.error, 'error');
        }
        setLoading(false);
    };

    const handleChallengeFriend = async (friend) => {
        if (!currentUser) return;

        setLoading(true);
        const battleLevelLabel = getLevelLabel(selectedBattleLevel);
        const battleTargetLabel = getTargetCorrectLabel(selectedTargetCorrect);
        const battleModeLabel = getBattleModeBadgeLabel(selectedBattleMode);
        const result = await createFriendRoom(
            currentUser.uid,
            myDisplayName || currentUser.displayName || 'Player',
            friend.id,
            friend.displayName || '',
            stats?.characterId || 'noah',
            stats?.equippedSkin || 'default',
            stats?.multiplayerRating,
            selectedBattleLevel,
            selectedTargetCorrect,
            selectedBattleMode,
        );

        if (result.success) {
            showMessage(`${friend.displayName} さんに${battleModeLabel}・${battleLevelLabel}・${battleTargetLabel}で対戦を申し込みました！`, 'success');
            navigate(`/multiplayer-match?room=${result.roomId}&friendName=${encodeURIComponent(friend.displayName || '')}&battleLevel=${encodeURIComponent(selectedBattleLevel)}&battleTarget=${selectedTargetCorrect}&battleMode=${encodeURIComponent(selectedBattleMode)}`);
        } else {
            showMessage(result.error || '対戦の招待に失敗しました', 'error');
        }
        setLoading(false);
    };

    const handleJoinInvite = (invite) => {
        navigate(`/multiplayer-match?room=${invite.id}&friendName=${encodeURIComponent(invite.player1?.displayName || '')}&battleLevel=${encodeURIComponent(invite.level || defaultBattleLevel)}&battleTarget=${normalizeTargetCorrect(invite.targetCorrect)}&battleMode=${encodeURIComponent(normalizeBattleMode(invite.battleMode))}`);
    };

    const copyFriendCode = async () => {
        if (!myFriendCode) {
            showMessage('フレンドコードがまだ作成されていません', 'error');
            return;
        }

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(myFriendCode);
            } else {
                const input = document.createElement('input');
                input.value = myFriendCode;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
            }
            showMessage('フレンドコードをコピーしました！', 'success');
        } catch {
            showMessage('コピーに失敗しました。長押しで選択してください', 'error');
        }
    };

    const copyInviteMessage = async () => {
        const inviteMessage = buildReferralInviteMessage({
            displayName: myDisplayName || currentUser?.displayName || 'トレーナー',
            code: myFriendCode,
        });

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Study Musume 招待',
                    text: inviteMessage,
                });
                showMessage('招待メッセージを共有しました！', 'success');
                return;
            }

            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(inviteMessage);
            } else {
                const input = document.createElement('textarea');
                input.value = inviteMessage;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
            }

            showMessage('招待メッセージをコピーしました！', 'success');
        } catch (error) {
            if (error?.name === 'AbortError') {
                return;
            }
            showMessage('招待メッセージの共有に失敗しました', 'error');
        }
    };

    const handleRedeemReferral = async () => {
        if (!currentUser) return;

        const normalizedCode = normalizeReferralCode(referralCode);
        if (!normalizedCode) {
            showMessage('招待コードを入力してください', 'error');
            return;
        }

        setLoading(true);
        const result = await redeemReferralCode({
            inviteeUid: currentUser.uid,
            inviteeDisplayName: myDisplayName || currentUser.displayName || 'トレーナー',
            inviterCode: normalizedCode,
        });

        if (result.success) {
            if (updateStats) {
                updateStats((currentStats) => applyRewardToStats(currentStats, result.reward));
            }
            setReferralCode('');
            showMessage(
                `${result.inviter.displayName} さんの招待特典を受け取りました！ 💎${result.reward.diamonds} / 🧠${result.reward.intellect}`,
                'success'
            );
            loadUserData(currentUser.uid);
        } else {
            showMessage(result.error || '招待コードの特典を受け取れませんでした', 'error');
        }
        setLoading(false);
    };

    const referralSummary = getReferralSummary(profile || {});
    const hasUsedReferralCode = Boolean(referralSummary.referredByCode);

    if (!currentUser) {
        return null;
    }

    return (
        <div className="friends-screen">
            {/* Header */}
            <div className="friends-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={24} />
                </button>
                <h1>
                    <Users size={28} />
                    フレンド
                </h1>
            </div>

            {/* My Friend Code */}
            <div className="my-friend-code">
                <div className="code-label">マイフレンドコード</div>
                <div className="code-display" onClick={copyFriendCode}>
                    <span className="code">{myFriendCode}</span>
                    <span className="copy-hint">タップでコピー</span>
                </div>
                <div className="invite-actions">
                    <button className="invite-action-btn primary" onClick={copyInviteMessage} disabled={loading}>
                        <Gift size={18} />
                        招待メッセージを共有
                    </button>
                    <button className="invite-action-btn" onClick={copyFriendCode} disabled={loading}>
                        <Copy size={18} />
                        コードだけコピー
                    </button>
                </div>
            </div>

            <div className="referral-card">
                <div className="referral-card-header">
                    <div>
                        <div className="referral-badge">招待報酬</div>
                        <h2>友だち招待でごほうび</h2>
                        <p>
                            招待が成立すると、お互いに 💎{REFERRAL_REWARD.diamonds} と 🧠{REFERRAL_REWARD.intellect} を受け取れます。
                        </p>
                    </div>
                    <div className="referral-icon">
                        <Ticket size={26} />
                    </div>
                </div>

                <div className="referral-stats">
                    <div className="referral-stat">
                        <span className="referral-stat-value">{referralSummary.inviteCount}</span>
                        <span className="referral-stat-label">成立した招待</span>
                    </div>
                    <div className="referral-stat">
                        <span className="referral-stat-value">{referralSummary.pendingClaims}</span>
                        <span className="referral-stat-label">次回反映予定</span>
                    </div>
                </div>

                {hasUsedReferralCode ? (
                    <div className="referral-status success">
                        招待コード入力済み: {referralSummary.referredByCode}
                    </div>
                ) : (
                    <div className="referral-entry">
                        <label htmlFor="referral-code-input">招待された人はこちら</label>
                        <div className="referral-entry-row">
                            <input
                                id="referral-code-input"
                                type="text"
                                placeholder="招待コードを入力"
                                value={referralCode}
                                onChange={(e) => setReferralCode(normalizeReferralCode(e.target.value))}
                                maxLength={6}
                                disabled={loading}
                            />
                            <button onClick={handleRedeemReferral} disabled={loading}>
                                受け取る
                            </button>
                        </div>
                        <p className="referral-entry-note">招待コードの入力は1回だけです。</p>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="friends-tabs">
                <button
                    className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
                    onClick={() => setActiveTab('friends')}
                >
                    <Users size={18} />
                    フレンド ({friends.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
                    onClick={() => setActiveTab('search')}
                >
                    <Search size={18} />
                    検索
                </button>
                <button
                    className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    <UserPlus size={18} />
                    申請・招待 {(pendingRequests.length + battleInvites.length) > 0 && `(${pendingRequests.length + battleInvites.length})`}
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Content */}
            <div className="friends-content">
                {activeTab === 'friends' && (
                    <div className="friends-list">
                        <div className="battle-settings-card">
                            <div className="battle-settings-header">
                                <div className="battle-settings-title">フレンド対戦の級</div>
                                <div className="battle-settings-note">招待した側の設定で出題級が決まります</div>
                            </div>
                            <label className="battle-level-select">
                                <span>出題する級</span>
                                <select
                                    value={selectedBattleLevel}
                                    onChange={(e) => setSelectedBattleLevel(e.target.value)}
                                    disabled={loading}
                                >
                                    {LEVEL_THRESHOLDS.map((level) => (
                                        <option key={level.level} value={level.level}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="battle-level-select">
                                <span>勝利条件</span>
                                <select
                                    value={selectedTargetCorrect}
                                    onChange={(e) => setSelectedTargetCorrect(Number(e.target.value))}
                                    disabled={loading}
                                >
                                    {FRIEND_MATCH_TARGET_OPTIONS.map((target) => (
                                        <option key={target} value={target}>
                                            {target}問先取
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="battle-level-select">
                                <span>対戦形式</span>
                                <select
                                    value={selectedBattleMode}
                                    onChange={(e) => setSelectedBattleMode(normalizeBattleMode(e.target.value))}
                                    disabled={loading}
                                >
                                    {FRIEND_MATCH_MODE_OPTIONS.map((mode) => (
                                        <option key={mode} value={mode}>
                                            {getBattleModeBadgeLabel(mode)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        {friends.length === 0 ? (
                            <div className="empty-state">
                                <Users size={48} />
                                <p>まだフレンドがいません</p>
                                <p className="hint">検索タブからフレンドを追加しよう！</p>
                            </div>
                        ) : (
                            friends.map(friend => (
                                <div key={friend.id} className="friend-card">
                                    <div className="friend-info">
                                        <div className="friend-name">{friend.displayName}</div>
                                        <div className="friend-code">{friend.friendCode}</div>
                                    </div>
                                    <div className="friend-actions">
                                        <button
                                            className="battle-btn"
                                            onClick={() => handleChallengeFriend(friend)}
                                            disabled={loading}
                                        >
                                            対戦する
                                        </button>
                                        <button
                                            className="remove-btn"
                                            onClick={() => handleRemoveFriend(friend.friendshipId)}
                                        >
                                            削除
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'search' && (
                    <div className="search-section">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="フレンドコードを入力"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                                maxLength={6}
                            />
                            <button
                                className="search-btn"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                <Search size={20} />
                                検索
                            </button>
                        </div>

                        {searchResult && (
                            <div className="search-result">
                                <div className="result-card">
                                    <div className="result-info">
                                        <div className="result-name">{searchResult.displayName}</div>
                                        <div className="result-code">{searchResult.friendCode}</div>
                                    </div>
                                    <button
                                        className="request-btn"
                                        onClick={handleSendRequest}
                                        disabled={loading}
                                    >
                                        申請する
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'requests' && (
                    <div className="requests-list">
                        {battleInvites.length > 0 && (
                            <div className="invite-group">
                                <div className="section-title">対戦招待</div>
                                {battleInvites.map(invite => (
                                    <div key={invite.id} className="invite-card">
                                        <div className="request-info">
                                            <div className="request-name">{invite.player1?.displayName || 'フレンド'}</div>
                                            <div className="request-code">フレンド対戦に招待されています</div>
                                            <div className="invite-badges">
                                                <div className="invite-level-badge">{getBattleModeBadgeLabel(invite.battleMode)}</div>
                                                <div className="invite-level-badge">{getLevelLabel(invite.level)}</div>
                                                <div className="invite-level-badge">{getTargetCorrectLabel(invite.targetCorrect)}</div>
                                            </div>
                                        </div>
                                        <button
                                            className="join-battle-btn"
                                            onClick={() => handleJoinInvite(invite)}
                                            disabled={loading}
                                        >
                                            対戦に参加
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {pendingRequests.length === 0 && battleInvites.length === 0 ? (
                            <div className="empty-state">
                                <UserPlus size={48} />
                                <p>フレンド申請や対戦招待はありません</p>
                            </div>
                        ) : (
                            pendingRequests.map(request => (
                                <div key={request.id} className="request-card">
                                    <div className="request-info">
                                        <div className="request-name">{request.displayName}</div>
                                        <div className="request-code">{request.friendCode}</div>
                                    </div>
                                    <div className="request-actions">
                                        <button
                                            className="accept-btn"
                                            onClick={() => handleAcceptRequest(request.friendshipId)}
                                            disabled={loading}
                                        >
                                            <Check size={18} />
                                            承認
                                        </button>
                                        <button
                                            className="reject-btn"
                                            onClick={() => handleRejectRequest(request.friendshipId)}
                                            disabled={loading}
                                        >
                                            <X size={18} />
                                            拒否
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Friends;
