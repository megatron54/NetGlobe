declare module "globe.gl" {
  interface GlobeInstance {
    (element: HTMLElement): GlobeInstance;
    globeImageUrl(url: string): GlobeInstance;
    bumpImageUrl(url: string): GlobeInstance;
    backgroundImageUrl(url: string): GlobeInstance;
    showAtmosphere(show: boolean): GlobeInstance;
    atmosphereColor(color: string): GlobeInstance;
    atmosphereAltitude(alt: number): GlobeInstance;
    animateIn(animate: boolean): GlobeInstance;
    width(w: number): GlobeInstance;
    height(h: number): GlobeInstance;
    pointOfView(pov: { lat?: number; lng?: number; altitude?: number }, transitionMs?: number): GlobeInstance;
    controls(): any;

    arcsData(data: any[]): GlobeInstance;
    arcColor(fn: string | ((d: any) => string)): GlobeInstance;
    arcStroke(width: number | ((d: any) => number)): GlobeInstance;
    arcDashLength(len: number | ((d: any) => number)): GlobeInstance;
    arcDashGap(gap: number | ((d: any) => number)): GlobeInstance;
    arcDashAnimateTime(ms: number | ((d: any) => number)): GlobeInstance;
    arcAltitudeAutoScale(scale: number | ((d: any) => number)): GlobeInstance;
    arcsTransitionDuration(ms: number): GlobeInstance;

    pointsData(data: any[]): GlobeInstance;
    pointColor(fn: string | ((d: any) => string)): GlobeInstance;
    pointAltitude(alt: number | ((d: any) => number)): GlobeInstance;
    pointRadius(radius: number | ((d: any) => number)): GlobeInstance;
    pointsMerge(merge: boolean): GlobeInstance;
    pointsTransitionDuration(ms: number): GlobeInstance;

    ringsData(data: any[]): GlobeInstance;
    ringColor(fn: (() => (t: number) => string) | string): GlobeInstance;
    ringMaxRadius(radius: number): GlobeInstance;
    ringPropagationSpeed(speed: number): GlobeInstance;
    ringRepeatPeriod(ms: number): GlobeInstance;
  }

  function Globe(): GlobeInstance;
  export default Globe;
}
