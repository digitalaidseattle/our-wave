/**
 *  TemplateConfig.tsx
 *
 *  @copyright 2025 Digital Aid Seattle
 *
 */
import { Link } from 'react-router-dom';

import {
    DashboardOutlined,
    FormOutlined
} from '@ant-design/icons';
import { HelpButton, MenuItem } from "@digitalaidseattle/mui";
import { Box } from "@mui/material";
import logo from "./assets/images/our-wave-logo.jpeg";

export const NAVIGATION_DRAWER_WIDTH = 240;
export const TemplateConfig = () => {
    const topLevel = {
        id: 'group-dashboard',
        title: 'Navigation',
        type: 'group',
        children: [
            {
                id: 'dashboard',
                title: 'Dashboard',
                type: 'item',
                url: '/',
                icon: <DashboardOutlined />
            },
            {
                id: 'GRNT-RECIPES',
                title: 'Grant Recipes',
                type: 'item',
                url: '/grant-recipes',
                icon: <FormOutlined />,
            }, {
                id: 'GRNT-PROPOSALS',
                title: 'Grant Proposals',
                type: 'item',
                url: '/grant-proposals',
                icon: <FormOutlined />,
            } as MenuItem

        ],
    } as MenuItem;

    return ({
        appName: 'Our Wave',
        logoUrl: logo,
        drawerWidth: NAVIGATION_DRAWER_WIDTH,
        menuItems: [topLevel],
        toolbarItems: [
            <Box key={1}><HelpButton /></Box >
        ],
        profileItems: [
            <Link
                style={{ 'textDecoration': 'none' }}
                color="secondary"
                to={`/privacy`}>
                Privacy Policy
            </Link>
        ],
        version: '0.0.1'
    });
}