import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { userAPI, authAPI } from '../client/client';

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

  // Choose MetaMask provider if multiple are injected
  const getMetaMaskProvider = () => {
    const eth = window.ethereum;
    if (!eth) return null;
    if (Array.isArray(eth?.providers)) {
      return eth.providers.find((p) => p && p.isMetaMask) || null;
    }
    return eth?.isMetaMask ? eth : null;
  };

  const checkConnection = async () => {
    const mm = getMetaMaskProvider();
    if (mm) {
      try {
        const accounts = await mm.request({ method: 'eth_accounts' });
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

            const newProvider = new ethers.BrowserProvider(mm);
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
    const mm = getMetaMaskProvider();
    if (!mm) {
      alert('MetaMask를 설치해 주세요!');
      return;
    }
    try {
      const accounts = await mm.request({ method: 'eth_requestAccounts' });
      handleAccountsChanged(accounts);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('지갑 연결에 실패했습니다.');
    }
  };

  const handleAccountsChanged = useCallback(async (accounts) => {
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
      return;
    }

    const newAccount = accounts[0];
    setAccount(newAccount);

    const savedAccount = localStorage.getItem('account');
    const savedToken = localStorage.getItem('token');
    const mm = getMetaMaskProvider();
    if (!mm) return;

    // 같은 계정이고 토큰이 있으면 재사용
    if (savedAccount && savedToken && savedAccount.toLowerCase() === newAccount.toLowerCase()) {
      const newProvider = new ethers.BrowserProvider(mm);
      const newSigner = await newProvider.getSigner();
      setProvider(newProvider);
      setSigner(newSigner);
      setToken(savedToken);
      const savedIsAdmin = localStorage.getItem('isAdmin') === 'true';
      const savedIsOrgAdmin = localStorage.getItem('isOrgAdmin') === 'true';
      setIsAdmin(savedIsAdmin);
      setIsOrgAdmin(savedIsOrgAdmin);
      return;
    }

    // 새 계정 로그인
    const newProvider = new ethers.BrowserProvider(mm);
    const newSigner = await newProvider.getSigner();
    setProvider(newProvider);
    setSigner(newSigner);

    try {
      const { message } = await authAPI.requestNonce(newAccount);
      const signature = await newSigner.signMessage(message);
      const response = await authAPI.verifySignature(newAccount, signature, message);

      const { token: jwtToken, user } = response;

      localStorage.setItem('token', jwtToken);
      localStorage.setItem('account', newAccount);
      setToken(jwtToken);

      // 권한 구분
      // user.isAdmin = true, adminOrganizationId = null → 전역 관리자
      // user.isAdmin = true, adminOrganizationId = 숫자 → 기관 관리자
      const adminStatus = user.isAdmin && !user.adminOrganizationId;
      const orgAdminStatus = user.isAdmin && !!user.adminOrganizationId;

      setIsAdmin(adminStatus);
      setIsOrgAdmin(orgAdminStatus);
      localStorage.setItem('isAdmin', String(adminStatus));
      localStorage.setItem('isOrgAdmin', String(orgAdminStatus));

      // 사용자 등록(백엔드에서 자동 생성되지만 안전하게 호출)
      await userAPI.register(newAccount);
    } catch (error) {
      console.error('로그인 실패:', error);
      alert(error.message || '로그인에 실패했습니다.');
    }
  }, []);

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

  useEffect(() => {
    const mm = getMetaMaskProvider();
    if (!mm) return;
    mm.on('accountsChanged', handleAccountsChanged);
    return () => {
      mm.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [handleAccountsChanged]);

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
