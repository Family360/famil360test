import { AdMob, BannerAdPosition, BannerAdSize, type AdMobRewardItem } from '@capacitor-community/admob';

const UNITS = {
  banner: 'ca-app-pub-2988836734399476/6391895057',
  interstitial: 'ca-app-pub-2988836734399476/3709891395',
  rewarded: 'ca-app-pub-2988836734399476/4831401371',
};

class AdsService {
  private initialized = false;
  private interstitialReady = false;
  private rewardedReady = false;

  async init() {
    if (this.initialized) return;
    try {
      await AdMob.initialize({ initializeForTesting: !!import.meta.env.DEV });
      this.initialized = true;
      // Preload ads
      this.loadInterstitial().catch(() => {});
      this.loadRewarded().catch(() => {});
    } catch (e) {
      console.warn('AdMob init failed', e);
    }
  }

  async requestConsentIfRequired() {
    try {
      const { isConsentFormAvailable } = await AdMob.requestConsentInfo();
      if (isConsentFormAvailable) {
        await AdMob.showConsentForm();
      }
    } catch {
      // ignore
    }
  }

  async showBanner() {
    try {
      await AdMob.showBanner({
        adId: UNITS.banner,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
      });
    } catch (e) {
      console.warn('Show banner failed', e);
    }
  }

  async hideBanner() {
    try { await AdMob.hideBanner(); } catch {}
  }

  async loadInterstitial() {
    try {
      await AdMob.prepareInterstitial({ adId: UNITS.interstitial });
      this.interstitialReady = true;
    } catch {
      this.interstitialReady = false;
    }
  }

  async showInterstitial() {
    if (!this.interstitialReady) {
      await this.loadInterstitial();
    }
    try {
      await AdMob.showInterstitial();
      this.interstitialReady = false;
      this.loadInterstitial().catch(() => {});
    } catch (e) {
      console.warn('Show interstitial failed', e);
    }
  }

  async maybeShowInterstitial(frequency = 5) {
    try {
      const key = 'ad_interstitial_count';
      const raw = localStorage.getItem(key) || '0';
      const count = parseInt(raw, 10) + 1;
      if (count >= frequency) {
        localStorage.setItem(key, '0');
        await this.showInterstitial();
      } else {
        localStorage.setItem(key, String(count));
      }
    } catch {}
  }

  async loadRewarded() {
    try {
      await AdMob.prepareRewardVideoAd({ adId: UNITS.rewarded });
      this.rewardedReady = true;
    } catch {
      this.rewardedReady = false;
    }
  }

  async showRewarded(onReward?: (reward: AdMobRewardItem) => void) {
    if (!this.rewardedReady) {
      await this.loadRewarded();
    }
    try {
      const result: any = await AdMob.showRewardVideoAd();
      const reward: AdMobRewardItem = result?.reward ?? result;
      this.rewardedReady = false;
      this.loadRewarded().catch(() => {});
      onReward?.(reward);
    } catch (e) {
      console.warn('Show rewarded failed', e);
    }
  }
}

const adsService = new AdsService();
export default adsService;
