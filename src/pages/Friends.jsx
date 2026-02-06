import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, UserPlus, Search, Check, X } from 'lucide-react';
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
import './Friends.css';

const Friends = () => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [myFriendCode, setMyFriendCode] = useState('');
    const [searchCode, setSearchCode] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('friends'); // friends, search, requests
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/login');
            return;
        }
        setCurrentUser(user);
        loadUserData(user.uid);
    }, [navigate]);

    const loadUserData = async (uid) => {
        setLoading(true);

        // マイフレンドコードを取得
        const profileResult = await getUserProfile(uid);
        if (profileResult.success) {
            setMyFriendCode(profileResult.data.friendCode);
        }

        // フレンドリストを取得
        const friendsResult = await getFriendsList(uid);
        if (friendsResult.success) {
            setFriends(friendsResult.friends);
        }

        // フレンド申請を取得
        const requestsResult = await getPendingRequests(uid);
        if (requestsResult.success) {
            setPendingRequests(requestsResult.requests);
        }

        setLoading(false);
    };

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

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const copyFriendCode = () => {
        navigator.clipboard.writeText(myFriendCode);
        showMessage('フレンドコードをコピーしました！', 'success');
    };

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
                    申請 {pendingRequests.length > 0 && `(${pendingRequests.length})`}
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
                                    <button
                                        className="remove-btn"
                                        onClick={() => handleRemoveFriend(friend.friendshipId)}
                                    >
                                        削除
                                    </button>
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
                        {pendingRequests.length === 0 ? (
                            <div className="empty-state">
                                <UserPlus size={48} />
                                <p>フレンド申請はありません</p>
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
