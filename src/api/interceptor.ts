import { AxiosError } from 'axios';

const responseErrorInterceptor = (error: AxiosError) => {
  // Logic to handle errors (e.g. logging, toast)
  if (error.response) {
    console.error(`API Error: ${error.response.status}`, error.response.data);
  } else {
    console.error('API Error: Network/Unknown', error.message);
  }
  return Promise.reject(error);
};

export default responseErrorInterceptor;
