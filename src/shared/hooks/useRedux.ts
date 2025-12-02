/**
 * Redux Custom Hooks
 *
 * 🎓 핵심 개념:
 * - 타입이 지정된 useDispatch, useSelector 제공
 * - 매번 타입을 지정하지 않아도 됨
 */

import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

/**
 * 타입이 지정된 useDispatch
 * Thunk 액션도 올바르게 타입 추론됨
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * 타입이 지정된 useSelector
 * state의 타입이 자동으로 RootState로 추론됨
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
