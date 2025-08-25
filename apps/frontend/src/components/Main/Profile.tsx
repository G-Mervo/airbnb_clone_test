import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Header from '../Header/Header';
import { MessageSquareMore } from '../icons/ProfileExtras';
import type { FC } from 'react';
import globe from '../../asset/globe.svg';

type ProfileTab = 'about' | 'trips';
type RootState = { app: { userData: any } };
interface ProfileProps {
  defaultTab?: ProfileTab;
}

const Profile: FC<ProfileProps> = ({ defaultTab = 'about' }) => {
  const userData = useSelector((state: RootState) => state.app.userData);
  const userInitial =
    String(userData?.user_metadata?.name ?? '')
      .charAt(0)
      .toUpperCase() || 'U';
  const [activeTab, setActiveTab] = React.useState<ProfileTab>(defaultTab);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* App Header (shared across site) */}
      <div
        id="header"
        className="z-50 bg-white fixed top-0 w-full 1xz:flex items-start justify-center"
      >
        <Header />
      </div>

      <main className="mx-auto max-w-[1300px] px-6 pt-28 lg:pt-36">
        <div className="grid grid-cols-1 gap-10 py-10 md:grid-cols-[320px_minmax(0,1fr)] md:gap-12 lg:py-14">
          {useMemo(
            () => (
              <aside className="relative">
                <h1 className="mb-6 text-4xl font-semibold tracking-tight">Profile</h1>
                <nav aria-label="Profile sections" className="space-y-2">
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-[15px] font-medium hover:bg-neutral-50 ${
                      activeTab === 'about' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-900'
                    }`}
                  >
                    {!userData && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 text-white">
                        {userInitial}
                      </div>
                    )}
                    {userData && (
                      <img
                        className="h-8 w-8 rounded-full"
                        src={userData.user_metadata.avatarUrl || globe}
                        alt="Avatar"
                      />
                    )}
                    <span>About me</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('trips')}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-[15px] font-medium hover:bg-neutral-50 ${
                      activeTab === 'trips' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-900'
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl">
                      <img src="/images/past-trips-icon.png" alt="Suitcase" className="h-7 w-7" />
                    </div>
                    <span>Past trips</span>
                  </button>
                </nav>
                <div className="pointer-events-none absolute right-[-24px] top-0 hidden h-full w-px bg-neutral-200 md:block" />
              </aside>
            ),
            [activeTab, userInitial],
          )}

          {activeTab === 'about' ? (
            <section className="pb-20">
              <div className="mb-6 flex items-center gap-3">
                <h2 className="text-[32px] font-semibold leading-none tracking-tight">About me</h2>
                <button className="h-7 rounded-full border border-neutral-200 bg-transparent px-3 text-xs text-neutral-700 hover:bg-neutral-50">
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
                <div className="rounded-2xl shadow-[0_12px_24px_rgba(0,0,0,0.06)]">
                  <div className="flex flex-col items-center gap-3 p-8">
                    {!userData && (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-900 text-4xl font-semibold text-white">
                        {userInitial}
                      </div>
                    )}
                    {userData && (
                      <img
                        className="h-24 w-24 rounded-full"
                        src={userData.user_metadata.avatarUrl || globe}
                        alt="Avatar"
                      />
                    )}
                    <div className="mt-1 text-3xl font-semibold">
                      {String(userData?.user_metadata?.name ?? 'Guest')}
                    </div>
                    <div className="text-sm text-neutral-500">Guest</div>
                  </div>
                </div>
                <div className="max-w-[460px]">
                  <h3 className="mb-2 text-[22px] font-semibold tracking-tight">
                    Complete your profile
                  </h3>
                  <p className="mb-5 text-[15px] leading-6 text-neutral-600">
                    Your Airbnb profile is an important part of every reservation. Complete yours to
                    help other hosts and guests get to know you.
                  </p>
                  <button className="h-10 rounded-lg px-5 text-[15px] font-semibold text-white bg-gradient-to-r from-[#FF385C] to-[#E61E4D] hover:from-[#FF385C]/90 hover:to-[#E61E4D]/90">
                    Get started
                  </button>
                </div>
              </div>
              <div className="my-10 border-t border-neutral-200" />
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200">
                  <MessageSquareMore className="h-5 w-5 text-neutral-700" />
                </div>
                <div className="text-[15px] font-medium">Reviews I've written</div>
              </div>
            </section>
          ) : (
            <section className="pb-20">
              <h2 className="mb-10 text-[32px] font-semibold leading-none tracking-tight">
                Past trips
              </h2>
              <div className="mx-auto flex max-w-[480px] flex-col items-center text-center">
                <img
                  src="/images/past-trips-hero.png"
                  alt="Travel suitcase"
                  className="mb-4 h-auto w-[180px]"
                />
                <p className="mb-4 max-w-[440px] text-[15px] leading-6 text-neutral-700">
                  You'll find your past reservations here after you've taken your first trip on
                  Airbnb.
                </p>
                <button className="h-10 rounded-lg px-5 text-[15px] font-semibold text-white bg-gradient-to-r from-[#FF385C] to-[#E61E4D] hover:from-[#FF385C]/90 hover:to-[#E61E4D]/90">
                  Book a trip
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
