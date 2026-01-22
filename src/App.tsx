import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import VerifyCode from './pages/VerifyCode'
import Dashboard from './pages/Dashboard'
import PatientDetails from './pages/PatientDetails'
import Share from './pages/Share'
import GenerateLink from './pages/GenerateLink'
import Settings from './pages/Settings'
import AddChronicCondition from './pages/AddChronicCondition'
import DoctorSignUp from './pages/DoctorSignUp'
import FaceIDVerification from './pages/FaceIDVerification'
import AuthSuccess from './pages/AuthSuccess'
import OTPVerification from './pages/OTPVerification'
import DoctorAccess from './pages/DoctorAccess'
import AddMedication from './pages/AddMedication'
import AddAllergies from './pages/AddAllergies'
import AddPastTreatments from './pages/AddPastTreatments'
import ChangePIN from './pages/ChangePIN'
import ChangePassword from './pages/ChangePassword'
import AddLabResults from './pages/AddLabResults'
import AddVaccinations from './pages/AddVaccinations'
import RecordDetail from './pages/RecordDetail'
import ShareCode from './pages/ShareCode'
import SettingsHistory from './pages/SettingsHistory'
import Support from './pages/Support'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import DeactivateAccount from './pages/DeactivateAccount'
import DeleteAccount from './pages/DeleteAccount'
import EditProfile from './pages/EditProfile'
import SharedLink from './pages/SharedLink'
import EmergencyMode from './pages/EmergencyMode'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signup/doctor" element={<DoctorSignUp />} />
        <Route path="/verify" element={<VerifyCode />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/verify-faceid" element={<FaceIDVerification />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        {/* Emergency Mode - Public, shows cached data */}
        <Route path="/emergency" element={<EmergencyMode />} />
        {/* Shared Link Route - Public but validates token */}
        <Route path="/shared/:token" element={<SharedLink />} />

        {/* Protected Patient Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/share" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Share />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/share/link" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <GenerateLink />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/share/code" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <ShareCode />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <Settings />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings/profile" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <EditProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings/history" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <SettingsHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/support" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <Support />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/privacy" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <Privacy />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/terms" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <Terms />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/deactivate" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <DeactivateAccount />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/delete" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <DeleteAccount />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings/security" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <ChangePIN />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings/password" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <ChangePassword />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add/chronic" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AddChronicCondition />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add/medication" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AddMedication />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add/allergies" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AddAllergies />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add/treatment" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AddPastTreatments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add/lab" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AddLabResults />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add/vaccine" 
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AddVaccinations />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/record/:type" 
          element={
            <ProtectedRoute allowedRoles={['patient', 'doctor']}>
              <RecordDetail />
            </ProtectedRoute>
          } 
        />

        {/* Doctor Routes */}
        <Route 
          path="/doctor-access" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorAccess />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/details" 
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <PatientDetails />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App