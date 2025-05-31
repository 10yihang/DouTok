package conf

type Config struct {
	Base      Base      `json:"app" yaml:"app"`
	Data      Data      `json:"data" yaml:"data"`
	Server    Server    `json:"server" yaml:"server"`
	Snowflake Snowflake `json:"snowflake" yaml:"snowflake"`
}
