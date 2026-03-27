import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

class AppErrorBoundaryInner extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('App error boundary caught an error.', error, info);
    }

    componentDidUpdate(prevProps) {
        if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
            this.setState({ error: null });
        }
    }

    render() {
        const { error } = this.state;

        if (!error) {
            return this.props.children;
        }

        return (
            <div
                style={{
                    minHeight: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    background: 'linear-gradient(180deg, #fff6ef 0%, #ffe4d0 100%)',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: '360px',
                        padding: '24px',
                        borderRadius: '24px',
                        background: 'rgba(255, 255, 255, 0.94)',
                        boxShadow: '0 20px 48px rgba(143, 76, 31, 0.14)',
                        color: '#51311d',
                    }}
                >
                    <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em', color: '#c06b2d' }}>
                        APP RECOVERY
                    </div>
                    <h2 style={{ margin: '10px 0 8px', fontSize: '24px', lineHeight: 1.3 }}>
                        画面の表示に失敗しました
                    </h2>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.7, color: '#6f4b36' }}>
                        いったんこの画面だけ安全に止めています。ホームに戻るか、再読み込みして続けられます。
                    </p>
                    <div style={{ display: 'grid', gap: '10px', marginTop: '18px' }}>
                        <button
                            type="button"
                            onClick={this.props.onGoHome}
                            style={{
                                border: 'none',
                                borderRadius: '14px',
                                padding: '14px 16px',
                                background: '#ff9d5c',
                                color: '#fff',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            ホームに戻る
                        </button>
                        <button
                            type="button"
                            onClick={this.props.onReload}
                            style={{
                                border: '1px solid #f2c7ab',
                                borderRadius: '14px',
                                padding: '14px 16px',
                                background: '#fffaf6',
                                color: '#7a4a2a',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            再読み込み
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}

const AppErrorBoundary = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <AppErrorBoundaryInner
            resetKey={`${location.pathname}${location.search}${location.hash}`}
            onGoHome={() => navigate('/home', { replace: true })}
            onReload={() => window.location.reload()}
        >
            {children}
        </AppErrorBoundaryInner>
    );
};

export default AppErrorBoundary;
