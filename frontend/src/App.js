import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  Heart,
  Users,
  TrendingUp,
  Calendar,
  Shield,
  CreditCard,
  Activity,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  FileText,
  Award,
  Database,
  Lock,
  Cpu,
  CreditCard as CreditIcon,
  Search,
  MapPin,
  Star,
  AlertTriangle,
  Brain

} from 'lucide-react';
import WalletConnect from './components/WalletConnect';
import MedicalRecordManager from './components/MedicalRecordManager';
import MFASystem from './components/MFASystem';
import ClaimEngine from './components/ClaimEngine';
import PaymentGateways from './components/PaymentGateways';
import PatientDashboard from './components/PatientDashboard';
import ProviderDirectory from './components/ProviderDirectory';
import { MapIntegration } from './components/MapIntegration';


// Contract ABIs (simplified for demo)
const HEALTHCARE_DRIPS_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_patient", "type": "address" },
      { "internalType": "address", "name": "_insurer", "type": "address" },
      { "internalType": "address", "name": "_token", "type": "address" },
      { "internalType": "uint256", "name": "_premiumAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_interval", "type": "uint256" }
    ],
    "name": "createPremiumDrip",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [premiumDrips, setPremiumDrips] = useState([]);
  const [fundingRequests, setFundingRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Contract addresses (would come from deployment.json)
  const CONTRACT_ADDRESS = "0x..."; // Replace with actual address

  useEffect(() => {
    connectWallet();
  }, []);

  const handleWalletConnect = async (walletInfo) => {
    try {
      setAccount(walletInfo.address);
      setProvider(walletInfo.provider);
      setContract(walletInfo.signer ? new ethers.Contract(CONTRACT_ADDRESS, HEALTHCARE_DRIPS_ABI, walletInfo.signer) : null);
      
      // Load initial data
      if (walletInfo.signer) {
        await loadUserData(walletInfo.signer, walletInfo.address);
      }
    } catch (error) {
      console.error('Error handling wallet connection:', error);
    }
  };

  const handleWalletDisconnect = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    setPremiumDrips([]);
    setFundingRequests([]);
  };

  const connectWallet = async () => {
    try {
      const ethereumProvider = await detectEthereumProvider();
      if (ethereumProvider) {
        const accounts = await ethereumProvider.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(ethereumProvider);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, HEALTHCARE_DRIPS_ABI, signer);

        setAccount(accounts[0]);
        setProvider(provider);
        setContract(contract);

        // Load initial data
        await loadUserData(contract, accounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const loadUserData = async (contract, userAddress) => {
    try {
      // Load user's premium drips
      const drips = await contract.getPatientPremiumDrips(userAddress);
      setPremiumDrips(drips);

      // Load active funding requests
      const requests = await contract.getActiveFundingRequests();
      setFundingRequests(requests);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const createPremiumDrip = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.createPremiumDrip(
        account, // patient
        "0x...", // insurer (would be input)
        "0x...", // token address
        ethers.utils.parseEther("0.5"), // $500 monthly premium
        30 * 24 * 60 * 60 // 30 days
      );

      await tx.wait();
      await loadUserData(contract, account);
      setLoading(false);
    } catch (error) {
      console.error('Error creating premium drip:', error);
      setLoading(false);
    }
  };

  const contributeToFunding = async (requestId, amount) => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.contributeToFunding(
        requestId,
        ethers.utils.parseEther(amount)
      );

      await tx.wait();
      await loadUserData(contract, account);
      setLoading(false);
    } catch (error) {
      console.error('Error contributing:', error);
      setLoading(false);
    }
  };

  const Dashboard = () => {
    if (isAuthenticated && user) {
      return <PatientDashboard user={user} token={token} />;
    }

    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">Active Premium Drips</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{premiumDrips.length}</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">Monthly Premium</h3>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">$500</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">Next Payment</h3>
              <p className="text-lg sm:text-xl font-bold text-gray-900">Dec 15, 2024</p>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg mb-4">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-2 uppercase tracking-wide">Coverage Status</h3>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-600">Active</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={createPremiumDrip} 
            disabled={loading} 
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-5 h-5" />
            {loading ? 'Creating...' : 'Create Premium Drip'}
          </button>
        </div>
      </div>
    );
  };

  const FundingRequests = () => (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-white">Community Funding Requests</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fundingRequests.map((requestId, index) => (
          <div key={index} className="bg-white/90 backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Emergency Surgery Fund</h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Patient needs funding for critical medical procedure
              </p>
              <div className="flex items-center gap-2 text-gray-900">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-xl font-bold">2,500</span>
              </div>
            </div>
            <div className="p-6 bg-gray-50">
              <button
                onClick={() => contributeToFunding(requestId, '0.1')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Heart className="w-4 h-4" />
                Contribute 0.1 ETH
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const Contributors = () => (
    <div className="space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-white">Contributor Community</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-xl mb-4">
            <UserPlus className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dr. Sarah Chen</h3>
            <p className="text-gray-600 mb-4">Cardiologist • Reputation: 850</p>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Award className="w-4 h-4 text-yellow-500" />
                <span>45 Reviews</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span>12.5 ETH Contributed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-xl mb-4">
            <UserPlus className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Dr. Michael Ross</h3>
            <p className="text-gray-600 mb-4">Neurologist • Reputation: 720</p>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Award className="w-4 h-4 text-yellow-500" />
                <span>32 Reviews</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span>8.3 ETH Contributed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-white/10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-8 sm:w-8 sm:h-8 text-purple-600" />
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Healthcare Drips
              </h1>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 order-3 sm:order-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'dashboard'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Dash</span>
              </button>
              <button
                onClick={() => setActiveTab('providers')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'providers'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Providers</span>
                <span className="sm:hidden">Prov</span>
              </button>
              <button
                onClick={() => setActiveTab('provider-map')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'provider-map'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
                <span className="sm:hidden">Map</span>
              </button>
              <button
                onClick={() => setActiveTab('funding')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'funding'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Funding</span>
                <span className="sm:hidden">Fund</span>
              </button>
              <button
                onClick={() => setActiveTab('contributors')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'contributors'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Award className="w-4 h-4" />
                <span className="hidden sm:inline">Contributors</span>
                <span className="sm:hidden">Contrib</span>
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'records'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Records</span>
                <span className="sm:hidden">Rec</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'security'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
                <span className="sm:hidden">Sec</span>
              </button>
              <button
                onClick={() => setActiveTab('emergency')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'emergency'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">Emergency</span>
                <span className="sm:hidden">Emerg</span>
              </button>
              <button
                onClick={() => setActiveTab('engine')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'engine'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span className="hidden sm:inline">Engine</span>
                <span className="sm:hidden">Eng</span>
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'payments'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <CreditIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Payments</span>
                <span className="sm:hidden">Pay</span>
              </button>
              <button
                onClick={() => setActiveTab('integration')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'integration'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">HL7/FHIR</span>
                <span className="sm:hidden">HL7</span>
              </button>
              <button
                onClick={() => setActiveTab('audit-logs')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'audit-logs'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Audit</span>
                <span className="sm:hidden">Aud</span>
              </button>
              <button
                onClick={() => setActiveTab('compliance')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'compliance'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Compliance</span>
                <span className="sm:hidden">Comp</span>
              </button>
              <button
                onClick={() => setActiveTab('anomalies')}
                className={`flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === 'anomalies'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span className="hidden sm:inline">Anomalies</span>
                <span className="sm:hidden">Anom</span>
              </button>
            </nav>

            <WalletConnect
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
              account={account}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {!account ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl">
            <AlertCircle className="w-16 h-16 text-purple-600 mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 max-w-md text-base sm:text-lg">
              Please connect your MetaMask wallet to access the Healthcare Drips platform
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'providers' && <ProviderDirectory />}
            {activeTab === 'provider-map' && <MapIntegration providers={[]} />}
            {activeTab === 'funding' && <FundingRequests />}
            {activeTab === 'contributors' && <Contributors />}
            {activeTab === 'records' && <MedicalRecordManager account={account} contract={contract} />}
            {activeTab === 'security' && <MFASystem account={account} contract={contract} />}
            {activeTab === 'emergency' && <EmergencyAccess account={account} />}
            {activeTab === 'engine' && <ClaimEngine account={account} contract={contract} />}
            {activeTab === 'payments' && <PaymentGateways account={account} contract={contract} />}
            {activeTab === 'integration' && <HL7FHIRIntegration />}
            {activeTab === 'audit-logs' && <AuditLogViewer />}
            {activeTab === 'compliance' && <ComplianceDashboard />}
            {activeTab === 'anomalies' && <AnomalyDashboard />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
