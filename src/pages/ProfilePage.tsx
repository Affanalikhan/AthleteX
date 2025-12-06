import React, { useState, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Box,
  Alert,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  IconButton,
  Snackbar
} from '@mui/material';
import { PhotoCamera, Delete, Add } from '@mui/icons-material';
import { useForm, Controller, SubmitHandler, Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAthlete } from '../hooks/useAthlete';
import { SportType } from '../models';

interface ProfileForm {
  name: string;
  phoneNumber: string;
  age: number;
  weight: number;
  height: number;
  sportsPlayed: string[];
  country: string;
  state: string;
  city: string;
  pinCode: string;
  dietPreference: 'vegetarian' | 'non-vegetarian' | 'vegan' | 'other';
}

const profileSchema = yup.object({
  name: yup.string().required('Name is required'),
  phoneNumber: yup.string()
    .matches(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number')
    .required('Phone number is required'),
  age: yup.number()
    .min(10, 'Age must be at least 10')
    .max(100, 'Age must be less than 100')
    .required('Age is required'),
  weight: yup.number()
    .min(20, 'Weight must be at least 20 kg')
    .max(200, 'Weight must be less than 200 kg')
    .required('Weight is required'),
  height: yup.number()
    .min(100, 'Height must be at least 100 cm')
    .max(250, 'Height must be less than 250 cm')
    .required('Height is required'),
  sportsPlayed: yup.array().min(1, 'Please select at least one sport'),
  country: yup.string().required('Country is required'),
  state: yup.string().required('State is required'),
  city: yup.string().required('City is required'),
  pinCode: yup.string()
    .matches(/^\d{4,10}$/, 'Please enter a valid pin code')
    .required('Pin code is required'),
  dietPreference: yup.string()
    .oneOf(['vegetarian', 'non-vegetarian', 'vegan', 'other'], 'Please select a valid diet preference')
    .required('Diet preference is required')
}).required() as yup.ObjectSchema<ProfileForm>;

const SPORTS_OPTIONS = [
  SportType.FOOTBALL,
  SportType.BASKETBALL,
  SportType.HANDBALL,
  SportType.ATHLETICS,
  SportType.HOCKEY,
  SportType.KABADDI
];

const ProfilePage: React.FC = () => {
  const {
    profile,
    loading,
    error,
    uploading,
    createProfile,
    updateProfile,
    uploadProfilePicture,
    deleteProfilePicture,
    clearError
  } = useAthlete();

  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileForm>({
    resolver: yupResolver(profileSchema) as unknown as Resolver<ProfileForm>,
    defaultValues: {
      name: '',
      phoneNumber: '',
      age: 0,
      weight: 0,
      height: 0,
      sportsPlayed: [],
      country: '',
      state: '',
      city: '',
      pinCode: '',
      dietPreference: 'vegetarian'
    }
  });

  // Calculate BMI
  const calculateBMI = (weight: number, height: number): number => {
    // Convert height from cm to meters
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };

  // Get BMI category
  const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  // Update form when profile loads
  React.useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name,
        phoneNumber: profile.phoneNumber,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        sportsPlayed: profile.sportsPlayed,
        country: profile.country,
        state: profile.state,
        city: profile.city,
        pinCode: profile.pinCode,
        dietPreference: profile.dietPreference || 'vegetarian'
      });
    }
  }, [profile, form]);

  const handleSubmit: SubmitHandler<ProfileForm> = async (data) => {
    try {
      clearError();
      if (profile) {
        await updateProfile(data);
      } else {
        await createProfile(data);
      }
      setShowSuccess(true);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      await uploadProfilePicture(file);
    } catch (error) {
      // Error is handled by the hook
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = async () => {
    try {
      await deleteProfilePicture();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  if (loading && !profile) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {profile ? 'Edit Profile' : 'Complete Your Profile'}
        </Typography>
        
        {!profile && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Welcome to AthleteX! 🎉
            </Typography>
            <Typography variant="body2">
              Please complete your profile to get personalized training recommendations and track your performance.
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Profile Picture Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={profile?.profilePictureUrl}
            sx={{ width: 120, height: 120, mr: 2 }}
          >
            {profile?.name?.charAt(0).toUpperCase()}
          </Avatar>
          
          <Box>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            
            <Button
              variant="outlined"
              startIcon={<PhotoCamera />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              sx={{ mr: 1 }}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>

            {profile?.profilePictureUrl && (
              <IconButton
                color="error"
                onClick={handleDeleteImage}
                disabled={uploading}
              >
                <Delete />
              </IconButton>
            )}
          </Box>
        </Box>

        <Box component="form" onSubmit={form.handleSubmit(handleSubmit)}>
          <Grid container spacing={3}>
            {/* Personal Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                {...form.register('name')}
                error={!!form.formState.errors.name}
                helperText={form.formState.errors.name?.message}
                label="Full Name"
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                {...form.register('phoneNumber')}
                error={!!form.formState.errors.phoneNumber}
                helperText={form.formState.errors.phoneNumber?.message}
                label="Phone Number"
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                {...form.register('age')}
                error={!!form.formState.errors.age}
                helperText={form.formState.errors.age?.message}
                label="Age"
                type="number"
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                {...form.register('weight')}
                error={!!form.formState.errors.weight}
                helperText={form.formState.errors.weight?.message}
                label="Weight (kg)"
                type="number"
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <Controller
                name="height"
                control={form.control}
                render={({ field, fieldState: { error } }) => {
                  const weight = form.watch('weight');
                  const height = parseFloat(String(field.value)) || 0;
                  const bmi = weight > 0 && height > 0 ? calculateBMI(weight, height) : 0;
                  const bmiCategory = bmi > 0 ? getBMICategory(bmi) : '';
                  
                  return (
                    <TextField
                      {...field}
                      fullWidth
                      label="Height (cm)"
                      type="number"
                      error={!!error}
                      helperText={error?.message || (bmi > 0 && `BMI: ${bmi.toFixed(1)} (${bmiCategory})`)}
                      onChange={(e) => {
                        field.onChange(e);
                        form.trigger('weight');
                      }}
                    />
                  );
                }}
              />
            </Grid>

            {/* Sports */}
            <Grid item xs={12}>
              <Controller
                name="sportsPlayed"
                control={form.control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!form.formState.errors.sportsPlayed}>
                    <InputLabel>Sports Played</InputLabel>
                    <Select
                      {...field}
                      multiple
                      input={<OutlinedInput label="Sports Played" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {SPORTS_OPTIONS.map((sport) => (
                        <MenuItem key={sport} value={sport}>
                          {sport.charAt(0).toUpperCase() + sport.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                    {form.formState.errors.sportsPlayed && (
                      <Typography variant="caption" color="error" sx={{ ml: 2, mt: 0.5 }}>
                        {form.formState.errors.sportsPlayed.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Diet Preference */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Diet Preference
              </Typography>
              <Controller
                name="dietPreference"
                control={form.control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Diet Preference</InputLabel>
                    <Select
                      {...field}
                      label="Diet Preference"
                    >
                      <MenuItem value="vegetarian">Vegetarian</MenuItem>
                      <MenuItem value="non-vegetarian">Non-Vegetarian</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Address
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                {...form.register('country')}
                error={!!form.formState.errors.country}
                helperText={form.formState.errors.country?.message}
                label="Country"
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                {...form.register('state')}
                error={!!form.formState.errors.state}
                helperText={form.formState.errors.state?.message}
                label="State"
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                {...form.register('city')}
                error={!!form.formState.errors.city}
                helperText={form.formState.errors.city?.message}
                label="City"
                fullWidth
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                {...form.register('pinCode')}
                error={!!form.formState.errors.pinCode}
                helperText={form.formState.errors.pinCode?.message}
                label="Pin Code"
                fullWidth
                required
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || uploading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : profile ? 'Update Profile' : 'Create Profile'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Profile {profile ? 'updated' : 'created'} successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilePage;
