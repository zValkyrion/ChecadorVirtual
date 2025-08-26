import bcrypt from 'bcryptjs';

const verifyCurrentHash = async () => {
  const password = 'Sofilook12121998';
  const storedHash = '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUiDoeA7jG';
  
  console.log('Testing password:', password);
  console.log('Against stored hash:', storedHash);
  
  try {
    const isValid = await bcrypt.compare(password, storedHash);
    console.log('Hash verification result:', isValid);
    
    if (!isValid) {
      console.log('Hash verification failed. Generating new hash...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('New hash:', newHash);
      
      // Verify the new hash works
      const newHashValid = await bcrypt.compare(password, newHash);
      console.log('New hash verification:', newHashValid);
    }
  } catch (error) {
    console.error('Error during verification:', error);
  }
};

verifyCurrentHash();
