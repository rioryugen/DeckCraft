// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import React from 'react'
import DashboardSidebar from './Components/DashboardSidebar'

const layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='flex pr-4 bg-white'>
            <DashboardSidebar />
            <div className='w-full'>

                {children}
            </div>
        </div>
    )
}

export default layout