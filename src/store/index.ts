import { configureStore } from '@reduxjs/toolkit';
import gameConfigReducer from './slices/gameConfigSlice';

export const store = configureStore({
  reducer: {
    gameConfig: gameConfigReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 