import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { account, isAdmin, isOrgAdmin, connectWallet, disconnectWallet } = useAuth();

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">
                BlockVote
              </span>
            </Link>

            {account && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/votes"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-indigo-500"
                >
                  투표 목록
                </Link>

                {/* 전역 관리자 메뉴 */}
                {isAdmin && (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-indigo-600 border-b-2 border-transparent hover:border-indigo-500"
                    >
                      전역 관리자 대시보드
                    </Link>
                    <Link
                      to="/admin/register-organization"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-indigo-600 border-b-2 border-transparent hover:border-indigo-500"
                    >
                      기관 등록
                    </Link>
                    <Link
                      to="/super-admin/organizations"
                      className="inline-flex items-center px-1 pt-1 text-sm font-medium text-indigo-600 border-b-2 border-transparent hover:border-indigo-500"
                    >
                      기관 관리자 설정
                    </Link>
                  </>
                )}

                {/* 기관 관리자 메뉴 (전역 관리자가 아닌 경우만) */}
                {isOrgAdmin && !isAdmin && (
                  <Link
                    to="/org-admin/dashboard"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-indigo-600 border-b-2 border-transparent hover:border-indigo-500"
                  >
                    기관 관리자 대시보드
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center">
            {account ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                {isAdmin && (
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-purple-600 rounded-full">
                    전역 관리자
                  </span>
                )}
                {isOrgAdmin && !isAdmin && (
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-full">
                    기관 관리자
                  </span>
                )}
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  연결 해제
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                지갑 연결
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
