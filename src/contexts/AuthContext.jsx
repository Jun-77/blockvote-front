import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { userAPI, authAPI } from '../api/client';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false); // 전역 관리자
  const [isOrgAdmin, setIsOrgAdmin] = useState(false); // 기관 관리자
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const currentAccount = accounts[0];
          const savedToken = localStorage.getItem('token');
          const savedAccount = localStorage.getItem('account');
          const savedIsAdmin = localStorage.getItem('isAdmin') === 'true';
          const savedIsOrgAdmin = localStorage.getItem('isOrgAdmin') === 'true';

          // 토큰이 있고 같은 계정이면 재사용
          if (savedToken && savedAccount && savedAccount.toLowerCase() === currentAccount.toLowerCase()) {
            setAccount(currentAccount);
            setToken(savedToken);
            setIsAdmin(savedIsAdmin);
            setIsOrgAdmin(savedIsOrgAdmin);

            const newProvider = new ethers.BrowserProvider(window.ethereum);
            const newSigner = await newProvider.getSigner();
            setProvider(newProvider);
            setSigner(newSigner);
          } else {
            // 다른 계정이거나 토큰이 없으면 새로 로그인
            handleAccountsChanged(accounts);
          }
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('MetaMask를 설치해 주세요!');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      handleAccountsChanged(accounts);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('지갑 연결에 실패했습니다.');
    }
  };

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setIsAdmin(false);
      setIsOrgAdmin(false);
      setProvider(null);
      setSigner(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('account');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('isOrgAdmin');
    } else {
      const newAccount = accounts[0];
      setAccount(newAccount);

      const newProvider = new ethers.BrowserProvider(window.ethereum);
      const newSigner = await newProvider.getSigner();
      setProvider(newProvider);
      setSigner(newSigner);

      // 로그인: 서버에서 nonce 받아 서명 후 JWT 발급
      try {
        const { message } = await authAPI.requestNonce(newAccount);
        const signature = await newSigner.signMessage(message);
        const response = await authAPI.verifySignature(newAccount, signature, message);

        console.log('verifySignature response:', response);
        const { token: jwtToken, user } = response;
        console.log('JWT Token:', jwtToken);
        console.log('User data:', user);

        // 토큰과 계정 정보 저장
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('account', newAccount);
        setToken(jwtToken);

        // 권한 구분
        // user.isAdmin = true, adminOrganizationId = null → 전역 관리자
        // user.isAdmin = true, adminOrganizationId = 숫자 → 기관 관리자
        let adminStatus = false;
        let orgAdminStatus = false;

        console.log('Checking permissions...');
        console.log('user.isAdmin:', user.isAdmin);
        console.log('user.adminOrganizationId:', user.adminOrganizationId);

        if (user.isAdmin && !user.adminOrganizationId) {
          adminStatus = true;
          orgAdminStatus = false;
          console.log('Set as Super Admin');
        } else if (user.isAdmin && user.adminOrganizationId) {
          adminStatus = false;
          orgAdminStatus = true;
          console.log('Set as Org Admin');
        } else {
          console.log('Set as Regular User');
        }

        setIsAdmin(adminStatus);
        setIsOrgAdmin(orgAdminStatus);
        localStorage.setItem('isAdmin', String(adminStatus));
        localStorage.setItem('isOrgAdmin', String(orgAdminStatus));

        console.log('Final state - isAdmin:', adminStatus, 'isOrgAdmin:', orgAdminStatus);

        // 사용자 등록(백엔드에서 자동 생성되지만 안전하게 호출)
        await userAPI.register(newAccount);
      } catch (error) {
        console.error('로그인 실패:', error);
        alert(error.message || '로그인에 실패했습니다.');
      }
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsAdmin(false);
    setIsOrgAdmin(false);
    setProvider(null);
    setSigner(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('account');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isOrgAdmin');
  };

  // MetaMask 계정 변경 이벤트
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const value = {
    account,
    isAdmin,
    isOrgAdmin,
    provider,
    signer,
    token,
    connectWallet,
    disconnectWallet,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
