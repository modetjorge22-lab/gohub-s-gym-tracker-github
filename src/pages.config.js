import Feed from './pages/Feed';
import MyActivity from './pages/MyActivity';
import Groups from './pages/Groups';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import LogActivity from './pages/LogActivity';
import MemberCalendar from './pages/MemberCalendar';
import StravaConnect from './pages/StravaConnect';
import Settings from './pages/Settings';
import ProfileSettings from './pages/ProfileSettings';
import IntegrationsSettings from './pages/IntegrationsSettings';
import Team from './pages/Team';
import Workouts from './pages/Workouts';
import __Layout from './Layout.jsx';

export const PAGES = {
  Feed,
  MyActivity,
  Groups,
  Dashboard,
  Landing,
  LogActivity,
  MemberCalendar,
  StravaConnect,
  Settings,
  ProfileSettings,
  IntegrationsSettings,
  Team,
  Workouts,
};

export const pagesConfig = {
  mainPage: 'Feed',
  Pages: PAGES,
  Layout: __Layout,
};
