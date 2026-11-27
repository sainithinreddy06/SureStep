import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
import main


class TerrainAvailabilityTests(unittest.TestCase):
    client = TestClient(main.app)
    inputs = dict(elevation=0, slope=0, temperature=0, humidity=0, rainfall=0,
                  wind_speed=0, earthquake_activity=0, historical_incidents=0,
                  terrain_type='mixed')

    def test_missing_model(self):
        with patch.object(main, 'model', None):
            self.assertEqual(self.client.get('/health').status_code, 503)
            result = self.client.post('/predict-risk', json=self.inputs)
            self.assertEqual(result.status_code, 503)
            self.assertNotIn('risk_score', result.json())

    def test_missing_or_unknown_inputs(self):
        for payload in ({}, {**self.inputs, 'terrain_type': 'unknown'}):
            self.assertEqual(self.client.post('/predict-risk', json=payload).status_code, 422)

    def test_valid_zeroes(self):
        class Tree:
            def predict(self, features):
                return [17.0]

        model = Tree()
        model.estimators_ = [Tree()]
        with patch.object(main, 'model', model):
            result = self.client.post('/predict-risk', json=self.inputs)
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()['risk_score'], 17)
