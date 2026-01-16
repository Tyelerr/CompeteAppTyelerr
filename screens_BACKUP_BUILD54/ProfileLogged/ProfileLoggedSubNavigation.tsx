import ContentSwitcher from "../../components/ContentSwitcher";

export default function ProfileLoggedSubNavigation(){
  return <ContentSwitcher buttonsDetails={[
    {title:'Favorite Tournaments', route:"ProfileLoggedFavoriteTournaments", icon:'heart'},
    {title:'Search Alerts', route:"ProfileLoggedSearchAlerts", icon:'notifications'}
  ]} />
}