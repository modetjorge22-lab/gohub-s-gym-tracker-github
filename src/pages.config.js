/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Groups from './pages/Groups';
import LogActivity from './pages/LogActivity';
import MemberCalendar from './pages/MemberCalendar';
import ProfileSettings from './pages/ProfileSettings';
import Settings from './pages/Settings';
import Team from './pages/Team';
import Workouts from './pages/Workouts';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import IntegrationsSettings from './pages/IntegrationsSettings';
import Landing from './pages/Landing';
import MyActivity from './pages/MyActivity';
import StravaConnect from './pages/StravaConnect';
import WhoopConnect from './pages/WhoopConnect';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Groups": Groups,
    "LogActivity": LogActivity,
    "MemberCalendar": MemberCalendar,
    "ProfileSettings": ProfileSettings,
    "Settings": Settings,
    "Team": Team,
    "Workouts": Workouts,
    "Dashboard": Dashboard,
    "Feed": Feed,
    "IntegrationsSettings": IntegrationsSettings,
    "Landing": Landing,
    "MyActivity": MyActivity,
    "StravaConnect": StravaConnect,
    "WhoopConnect": WhoopConnect,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};