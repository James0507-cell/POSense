import SideBar from './components/sideBar.js'
import MainContent from './components/mainContent.js'
import './page.css'

export default function Home() {
  return (
      <>
          <div className = 'appContainer'>
              <SideBar></SideBar>
              <MainContent></MainContent>
          </div>

      </>
  );
}
