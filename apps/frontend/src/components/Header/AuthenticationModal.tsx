// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import cross from '../../asset/Icons_svg/cross.svg';
import google from '../../asset/Icons_svg/Google.svg';
import { useDispatch, useSelector } from 'react-redux';
import { setShowLogin } from '../../redux/AppSlice';
import { loginWithEmail, signInWithGoogle } from '../../api/apiAuthentication';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const useModalTransition = (isOpen) => {
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setVisible(true), 50);
    } else {
      setVisible(false);
      setTimeout(() => setShouldRender(false), 0);
    }
  }, [isOpen]);
  return { visible, shouldRender };
};

const useScrollLock = (isOpen) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
};

const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        handler();
      }
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [ref, handler]);
};

const EmailInput = ({ value, onChange, isActive, onFocus, onBlur, hasError }) => (
  <div className="relative">
    <label
      htmlFor="email"
      className={`w-full absolute text-grey font-light left-3 transition-all duration-[0.1s] ${
        isActive || value ? 'text-xs top-2' : 'top-1/2 -translate-y-3'
      }`}
    >
      Email
    </label>
    <input
      type="email"
      id="email"
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`w-full px-3 py-2 pt-5 border ${
        hasError ? 'border-red-500' : 'border-grey-light-50'
      } focus:border-2 flex items-center h-14 rounded-lg focus:border-black outline-none`}
      placeholder=""
      autoComplete="email"
    />
  </div>
);

const PasswordInput = ({ value, onChange, isActive, onFocus, onBlur, hasError }) => (
  <div className="relative">
    <label
      htmlFor="password"
      className={`w-full absolute text-grey font-light left-3 transition-all duration-[0.1s] ${
        isActive || value ? 'text-xs top-2' : 'top-1/2 -translate-y-3'
      }`}
    >
      Password
    </label>
    <input
      type="password"
      id="password"
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      className={`w-full px-3 py-2 pt-5 border ${
        hasError ? 'border-red-500' : 'border-grey-light-50'
      } focus:border-2 flex items-center h-14 rounded-lg focus:border-black outline-none`}
      placeholder=""
      autoComplete="current-password"
    />
  </div>
);

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required.').email('Please enter a valid email address.'),
  password: z.string().min(4, 'Password must be at least 4 characters.'),
});

const LoginForm = ({ onSubmit, loginError }) => {
  const dispatch = useDispatch();
  const [activeInput, setActiveInput] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (loginError) {
      setError('email', { type: 'server', message: loginError });
    }
  }, [loginError, setError]);

  const handleFormSubmit = (data) => {
    onSubmit(data.email, data.password);
  };

  return (
    <div className="w-full p-6">
      <div className="mt-2 mb-6 text-2xl font-medium">Welcome to Airbnb</div>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="pt-4">
          <div className="mb-4">
            <Controller
              name="email"
              control={control}
              render={({ field, fieldState }) => (
                <EmailInput
                  value={field.value}
                  onChange={field.onChange}
                  isActive={activeInput === 'email'}
                  onFocus={() => setActiveInput('email')}
                  onBlur={() => {
                    field.onBlur();
                    setActiveInput('');
                  }}
                  hasError={!!fieldState.error}
                />
              )}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-2 px-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Controller
              name="password"
              control={control}
              render={({ field, fieldState }) => (
                <PasswordInput
                  value={field.value}
                  onChange={field.onChange}
                  isActive={activeInput === 'password'}
                  onFocus={() => setActiveInput('password')}
                  onBlur={() => {
                    field.onBlur();
                    setActiveInput('');
                  }}
                  hasError={!!fieldState.error}
                />
              )}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-2 px-1">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="text-sm text-grey-600 mt-2">
          We'll call or text you to confirm your number. Standard message and data rates apply.{' '}
          <span className="underline cursor-pointer">Privacy Policy</span>
        </div>

        <button type="submit" className="w-full h-12 mt-4 rounded-lg text-white btnColor">
          Sign in
        </button>
      </form>

      <div className="py-5 flex items-center">
        <div className="h-[1px] w-full bg-grey-light" />
        <span className="w-20 text-center text-xs">or</span>
        <div className="h-[1px] w-full bg-grey-light" />
      </div>

      <button
        onClick={async () => {
          try {
            await signInWithGoogle();
            dispatch(setShowLogin(false));
          } catch (error) {
            console.error('Google sign-in failed:', error);
          }
        }}
        className="w-full cursor-pointer h-12 border px-5 py-3 border-black rounded-lg flex items-center justify-between"
      >
        <img src={google} className="h-5 w-5" alt="" />
        <span className="text-sm font-medium">Continue with Google</span>
        <div className="px-2" />
      </button>

      <button
        onClick={async () => {
          try {
            console.log('Apple login clicked');
            // Add your Apple authentication logic here
            // await signInWithApple();
            dispatch(setShowLogin(false));
          } catch (error) {
            console.error('Apple sign-in failed:', error);
          }
        }}
        className="w-full cursor-pointer mt-2 h-12 border px-5 py-3 border-black rounded-lg flex items-center justify-between"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
        </svg>
        <span className="text-sm font-medium">Continue with Apple</span>
        <div className="px-2" />
      </button>

      <button
        onClick={() => {
          console.log('Continue with email button clicked');
        }}
        className="w-full cursor-pointer mt-2 h-12 border px-5 py-3 border-black rounded-lg flex items-center justify-between"
      >
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <span className="text-sm font-medium">Continue with email</span>
        <div className="px-2" />
      </button>

      <button
        onClick={async () => {
          try {
            console.log('Facebook login clicked');
            // Add your Facebook authentication logic here
            // await signInWithFacebook();
            dispatch(setShowLogin(false));
          } catch (error) {
            console.error('Facebook sign-in failed:', error);
          }
        }}
        className="w-full cursor-pointer mt-2 h-12 border px-5 py-3 border-black rounded-lg flex items-center justify-between"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
        <span className="text-sm font-medium">Continue with Facebook</span>
        <div className="px-2" />
      </button>
    </div>
  );
};

const AuthenticationModal = () => {
  const ref = useRef();
  const dispatch = useDispatch();
  const isOpen = useSelector((store) => store.app.showLogin);
  const { visible, shouldRender } = useModalTransition(isOpen);
  const [loginError, setLoginError] = useState('');

  useScrollLock(isOpen);
  useClickOutside(ref, () => {
    dispatch(setShowLogin(false));
    setLoginError('');
  });

  const handleLogin = async (email, password) => {
    try {
      setLoginError('');
      await loginWithEmail(email, password);
      dispatch(setShowLogin(false));
    } catch (error) {
      console.error('Email login failed:', error);
      setLoginError('Incorrect login information');
    }
  };

  if (!shouldRender) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000001]">
      <div
        ref={ref}
        className={`bg-white ${
          visible
            ? '1xz:translate-y-0 bottom-0 1xz:bottom-auto opacity-100'
            : '1xz:translate-y-16 translate-y-full opacity-0'
        } transition-all fixed 1xz:w-[35.5rem] w-full rounded-3xl 1xz:duration-[0.2s] duration-300 flex flex-col ease-out items-center justify-center shadow-2xl z-[10000001]`}
      >
        <div className="items-center border-b-[1px] border-grey-light-50 justify-between flex 1xz:w-[35.5rem] w-full px-6 h-[3.9rem]">
          <button
            onClick={() => {
              dispatch(setShowLogin(false));
              setLoginError('');
            }}
            className="w-6 h-6 flex items-center justify-center cursor-pointer hover:rounded-full hover:bg-grey-dim"
          >
            <img src={cross} className="h-4 w-4" alt="" />
          </button>
          <span className="font-semibold">Log in or sign up</span>
          <div className="px-4" />
        </div>
        <LoginForm onSubmit={handleLogin} loginError={loginError} />
      </div>
    </div>,
    document.body,
  );
};

export default AuthenticationModal;
