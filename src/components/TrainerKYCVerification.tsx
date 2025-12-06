import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  IconButton,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Send,
  Refresh,
  Verified,
  Warning,
} from '@mui/icons-material';
import mongoService from '../services/mongoService';
import trainerAuthService from '../services/trainerAuthService';

interface KYCVerificationProps {
  onComplete?: () => void;
}

const TrainerKYCVerification: React.FC<KYCVerificationProps> = ({ onComplete }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Aadhar Card State
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [aadharVerified, setAadharVerified] = useState(false);
  
  // PAN Card State
  const [panNumber, setPanNumber] = useState('');
  const [panFile, setPanFile] = useState<File | null>(null);
  const [panVerified, setPanVerified] = useState(false);
  
  // Email State
  const [email, setEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  
  // Phone State
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const steps = ['Aadhar Card', 'PAN Card', 'Email Verification', 'Phone Verification'];

  // Validate Aadhar Number (12 digits)
  const validateAadhar = (number: string) => {
    return /^\d{12}$/.test(number);
  };

  // Validate PAN Number (ABCDE1234F format)
  const validatePAN = (number: string) => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(number);
  };

  // Validate Email
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate Phone (10 digits)
  const validatePhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  // Handle Aadhar Verification
  const handleAadharVerification = async () => {
    setError('');
    setSuccess('');
    
    if (!validateAadhar(aadharNumber)) {
      setError('Please enter a valid 12-digit Aadhar number');
      return;
    }
    
    if (!aadharFile) {
      setError('Please upload Aadhar card document');
      return;
    }
    
    setLoading(true);
    
    try {
      const currentTrainer = trainerAuthService.getCurrentTrainer();
      if (currentTrainer) {
        // Save to MongoDB
        await mongoService.updateTrainerKYC(currentTrainer.id, {
          aadharCard: {
            number: aadharNumber,
            verified: true,
            documentUrl: '' // In production, upload file to storage
          }
        });
      }
      
      setAadharVerified(true);
      setSuccess('Aadhar card verified successfully!');
      setLoading(false);
      setTimeout(() => {
        setActiveStep(1);
        setSuccess('');
      }, 1500);
    } catch (error) {
      console.error('Error verifying Aadhar:', error);
      setError('Failed to verify Aadhar. Please try again.');
      setLoading(false);
    }
  };

  // Handle PAN Verification
  const handlePANVerification = async () => {
    setError('');
    setSuccess('');
    
    if (!validatePAN(panNumber.toUpperCase())) {
      setError('Please enter a valid PAN number (e.g., ABCDE1234F)');
      return;
    }
    
    if (!panFile) {
      setError('Please upload PAN card document');
      return;
    }
    
    setLoading(true);
    
    try {
      const currentTrainer = trainerAuthService.getCurrentTrainer();
      if (currentTrainer) {
        // Save to MongoDB
        await mongoService.updateTrainerKYC(currentTrainer.id, {
          panCard: {
            number: panNumber.toUpperCase(),
            verified: true,
            documentUrl: '' // In production, upload file to storage
          }
        });
      }
      
      setPanVerified(true);
      setSuccess('PAN card verified successfully!');
      setLoading(false);
      setTimeout(() => {
        setActiveStep(2);
        setSuccess('');
      }, 1500);
    } catch (error) {
      console.error('Error verifying PAN:', error);
      setError('Failed to verify PAN. Please try again.');
      setLoading(false);
    }
  };

  // Send Email OTP
  const handleSendEmailOTP = async () => {
    setError('');
    setSuccess('');
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setEmailOtpSent(true);
      setSuccess('OTP sent to your email!');
      setLoading(false);
    }, 1500);
  };

  // Verify Email OTP
  const handleVerifyEmailOTP = async () => {
    setError('');
    setSuccess('');
    
    if (emailOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    
    try {
      // In real implementation, verify OTP with backend
      if (emailOtp === '123456' || emailOtp.length === 6) {
        const currentTrainer = trainerAuthService.getCurrentTrainer();
        if (currentTrainer) {
          // Save to MongoDB
          await mongoService.updateTrainerKYC(currentTrainer.id, {
            email: {
              address: email,
              verified: true
            }
          });
        }
        
        setEmailVerified(true);
        setSuccess('Email verified successfully!');
        setLoading(false);
        setTimeout(() => {
          setActiveStep(3);
          setSuccess('');
        }, 1500);
      } else {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      setError('Failed to verify email. Please try again.');
      setLoading(false);
    }
  };

  // Send Phone OTP
  const handleSendPhoneOTP = async () => {
    setError('');
    setSuccess('');
    
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setPhoneOtpSent(true);
      setSuccess('OTP sent to your phone!');
      setLoading(false);
    }, 1500);
  };

  // Verify Phone OTP
  const handleVerifyPhoneOTP = async () => {
    setError('');
    setSuccess('');
    
    if (phoneOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    
    try {
      // In real implementation, verify OTP with backend
      if (phoneOtp === '123456' || phoneOtp.length === 6) {
        const currentTrainer = trainerAuthService.getCurrentTrainer();
        if (currentTrainer) {
          // Save to MongoDB
          await mongoService.updateTrainerKYC(currentTrainer.id, {
            phone: {
              number: phone,
              verified: true
            }
          });
          
          // Mark trainer verification as complete
          await mongoService.verifyPhone(currentTrainer.id);
        }
        
        setPhoneVerified(true);
        setSuccess('Phone verified successfully!');
        setLoading(false);
        
        // All verifications complete
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 1500);
      } else {
        setError('Invalid OTP. Please try again.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error verifying phone:', error);
      setError('Failed to verify phone. Please try again.');
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'aadhar' | 'pan') => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      
      if (type === 'aadhar') {
        setAadharFile(file);
      } else {
        setPanFile(file);
      }
      setError('');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        KYC Verification
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Complete your KYC verification to become a verified trainer
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Step 0: Aadhar Card */}
      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Typography variant="h6">Aadhar Card Verification</Typography>
              {aadharVerified && <Chip icon={<Verified />} label="Verified" color="success" size="small" />}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Aadhar Card Number"
                  value={aadharNumber}
                  onChange={(e) => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="Enter 12-digit Aadhar number"
                  disabled={aadharVerified}
                  InputProps={{
                    endAdornment: aadharVerified && (
                      <InputAdornment position="end">
                        <CheckCircle color="success" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                  disabled={aadharVerified}
                >
                  {aadharFile ? aadharFile.name : 'Upload Aadhar Card (PDF/Image)'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'aadhar')}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Max file size: 5MB. Supported formats: PDF, JPG, PNG
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAadharVerification}
                  disabled={loading || aadharVerified}
                  startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                >
                  {loading ? 'Verifying...' : aadharVerified ? 'Verified' : 'Verify Aadhar'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Step 1: PAN Card */}
      {activeStep === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Typography variant="h6">PAN Card Verification</Typography>
              {panVerified && <Chip icon={<Verified />} label="Verified" color="success" size="small" />}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="PAN Card Number"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="Enter PAN number (e.g., ABCDE1234F)"
                  disabled={panVerified}
                  InputProps={{
                    endAdornment: panVerified && (
                      <InputAdornment position="end">
                        <CheckCircle color="success" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                  disabled={panVerified}
                >
                  {panFile ? panFile.name : 'Upload PAN Card (PDF/Image)'}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'pan')}
                  />
                </Button>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Max file size: 5MB. Supported formats: PDF, JPG, PNG
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveStep(0)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handlePANVerification}
                    disabled={loading || panVerified}
                    startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                  >
                    {loading ? 'Verifying...' : panVerified ? 'Verified' : 'Verify PAN'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Email Verification */}
      {activeStep === 2 && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Typography variant="h6">Email Verification</Typography>
              {emailVerified && <Chip icon={<Verified />} label="Verified" color="success" size="small" />}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  disabled={emailOtpSent || emailVerified}
                  InputProps={{
                    endAdornment: emailVerified && (
                      <InputAdornment position="end">
                        <CheckCircle color="success" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {!emailOtpSent && (
                <Grid item xs={12}>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveStep(1)}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSendEmailOTP}
                      disabled={loading || emailVerified}
                      startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </Button>
                  </Box>
                </Grid>
              )}

              {emailOtpSent && !emailVerified && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Enter OTP"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleSendEmailOTP} size="small">
                              <Refresh />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Didn't receive OTP? Click the refresh icon to resend
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleVerifyEmailOTP}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Phone Verification */}
      {activeStep === 3 && (
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Typography variant="h6">Phone Verification</Typography>
              {phoneVerified && <Chip icon={<Verified />} label="Verified" color="success" size="small" />}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit phone number"
                  disabled={phoneOtpSent || phoneVerified}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                    endAdornment: phoneVerified && (
                      <InputAdornment position="end">
                        <CheckCircle color="success" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {!phoneOtpSent && (
                <Grid item xs={12}>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      onClick={() => setActiveStep(2)}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSendPhoneOTP}
                      disabled={loading || phoneVerified}
                      startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                    >
                      {loading ? 'Sending...' : 'Send OTP'}
                    </Button>
                  </Box>
                </Grid>
              )}

              {phoneOtpSent && !phoneVerified && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Enter OTP"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleSendPhoneOTP} size="small">
                              <Refresh />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                      Didn't receive OTP? Click the refresh icon to resend
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleVerifyPhoneOTP}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                  </Grid>
                </>
              )}

              {phoneVerified && (
                <Grid item xs={12}>
                  <Alert severity="success" icon={<Verified />}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      KYC Verification Complete!
                    </Typography>
                    <Typography variant="body2">
                      All your documents have been verified successfully. Your profile will be reviewed by our team.
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TrainerKYCVerification;
