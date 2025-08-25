import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingPageSkeleton from '../components/Main/LandingPageSkeleton';
import CarouselSkeleton from '../components/Main/CarouselSkeleton';
import HeaderSkeleton from '../components/Header/HeaderSkeleton';

describe('Skeleton Components', () => {
  test('LandingPageSkeleton renders without crashing', () => {
    render(<LandingPageSkeleton />);
    // Check if the skeleton elements are present
    const skeletonElements = document.querySelectorAll('.animate-shimmer');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  test('CarouselSkeleton renders without crashing', () => {
    render(<CarouselSkeleton title="Test Section" />);
    // Check if the skeleton elements are present
    const skeletonElements = document.querySelectorAll('.animate-shimmer');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  test('HeaderSkeleton renders without crashing', () => {
    render(<HeaderSkeleton />);
    // Check if the skeleton elements are present
    const skeletonElements = document.querySelectorAll('.animate-shimmer');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  test('Skeleton components have proper shimmer animation class', () => {
    render(<LandingPageSkeleton />);
    const shimmerElements = document.querySelectorAll('.animate-shimmer');
    shimmerElements.forEach(element => {
      expect(element).toHaveClass('animate-shimmer');
    });
  });
});
