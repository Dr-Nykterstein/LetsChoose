import React, { useEffect, useContext } from 'react';
import { Grid, Card, Page as TablerPage } from 'tabler-react';
import { useParams } from 'react-router-dom';

import Page from 'app/components/Page';
import ContestCard from 'app/components/ContestCard';
import AuthContext from 'app/context/AuthContext';
import { useContestAll } from 'app/hooks/api/contest';

const UserPage = () => {
  const { id } = useParams();
  const auth = useContext(AuthContext);
  const {
    data: { data: contests = [] } = {},
    ...contestsQuery
  } = useContestAll({ author: id });
  useEffect(() => {
    if (contestsQuery.error && contestsQuery.error.response.status === 401) {
      auth.logout();
    }
  }, [contestsQuery.error]);
  return (
    <Page>
      <TablerPage.Content>
        <Grid.Row>
          <Grid.Col lg={4} width={12}>
            <Card className="card-profile">
              <Card.Header backgroundURL="https://preview.tabler.io/demo/photos/eberhard-grossgasteiger-311213-500.jpg" />
              <Card.Body className="text-center">
                <img
                  alt=""
                  className="card-profile-img"
                  src="https://preview.tabler.io/demo/faces/male/16.jpg"
                />
                <h3 className="mb-3">Peter Richards</h3>
                <p className="mb-4">
                  Big belly rude boy, million dollar hustler. Unemployed.
                </p>
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                >
                  <span className="fa fa-twitter" /> Follow
                </button>
              </Card.Body>
            </Card>
          </Grid.Col>
          <Grid.Col lg={8} width={12}>
            <Grid.Row>
              {contestsQuery.isSuccess &&
                contests.map((contest) => (
                  <Grid.Col width={12} md={6} lg={6} key={contest._id}>
                    <ContestCard data={contest} />
                  </Grid.Col>
                ))}
            </Grid.Row>
          </Grid.Col>
        </Grid.Row>
      </TablerPage.Content>
    </Page>
  );
};

export default UserPage;
