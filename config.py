import yaml
import os
from pathlib import Path


class Config:
    def __init__(self, config_path='config.yaml'):
        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self):
        if not os.path.exists(self.config_path):
            raise FileNotFoundError(
                f"Configuration file not found: {self.config_path}\n"
                f"Please create config.yaml based on config.yaml.example"
            )

        with open(self.config_path, 'r') as f:
            config = yaml.safe_load(f)

        return config

    def get(self, *keys, default=None):
        value = self.config
        for key in keys:
            if isinstance(value, dict):
                value = value.get(key)
                if value is None:
                    return default
            else:
                return default
        return value

    @property
    def secret_key(self):
        return self.get('app', 'secret_key')

    @property
    def debug(self):
        return self.get('app', 'debug', default=False)

    @property
    def firebase_credentials_path(self):
        return self.get('firebase', 'credentials_path')

    @property
    def current_year(self):
        return self.get('app_settings', 'current_year')

    @property
    def predictions_open(self):
        return self.get('app_settings', 'predictions_open', default=True)

    @property
    def admin_usernames(self):
        return self.get('app_settings', 'admin_usernames', default=[])


def load_config(config_path='config.yaml'):
    return Config(config_path)
