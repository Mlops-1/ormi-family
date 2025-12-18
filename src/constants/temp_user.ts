export const TEMP_USER_ID = 50000;

export const getTempUser = () => {
  return {
    id: TEMP_USER_ID,
    name: 'Test User',
  };
};
