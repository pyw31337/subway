"use client";

import { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
                    <div className="text-6xl mb-4">🚇</div>
                    <h1 className="text-2xl font-bold mb-2">앱 로드 중 문제가 발생했습니다</h1>
                    <p className="text-gray-400 text-center mb-4">
                        지도 API 연결에 실패했을 수 있습니다.<br />
                        페이지를 새로고침해 주세요.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold transition-colors"
                    >
                        새로고침
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
