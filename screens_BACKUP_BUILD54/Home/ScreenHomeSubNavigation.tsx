import ContentSwitcher from "../../components/ContentSwitcher";

export default function ScreenHomeSubNavigation(){
  return <ContentSwitcher buttonsDetails={[
    {
      title: 'Latest News',
      route: 'LatestNews',
      icon: 'newspaper'
    },
    {
      title: 'Featured Player',
      route: 'HomeFeaturedPlayer',
      icon: 'trophy'
    },
    {
      title: 'Featured Bar',
      route: 'HomeFeaturedBar',
      icon: 'bar-chart'
    }
  ]} />
}