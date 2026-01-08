/**
 * GrantProposalsDetailPage.tsx
 * 
 * @copyright 2026 Digital Aid Seattle
*/
import { HomeOutlined } from "@ant-design/icons";
import { Breadcrumbs, IconButton, Typography } from "@mui/material";
import { NavLink } from "react-router-dom";
import { LoadingOverlay } from "../../components/LoadingOverlay";

const GrantProposalsDetailPage: React.FC = () => {
  return (
    <>
      <LoadingOverlay />
      <Breadcrumbs aria-label="breadcrumb">
        <NavLink to="/" ><IconButton size="medium"><HomeOutlined /></IconButton></NavLink>
        <NavLink to={`/grant-proposals`} >Proposals</NavLink>
        <Typography color="text.primary">Proposal Detail</Typography>
      </Breadcrumbs>
      <div>
        <Typography variant="h4">Grant Proposal Detail</Typography>
        <Typography>This is a blank detail page for grant proposals.</Typography>
      </div>
    </>
  );
};

export default GrantProposalsDetailPage;

