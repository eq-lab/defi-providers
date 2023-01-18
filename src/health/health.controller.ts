import { GrpcMethod } from '@nestjs/microservices';
import { Controller } from '@nestjs/common';

enum ServingStatus {
  UNKNOWN = 0,
  SERVING = 1,
  NOT_SERVING = 2,
}

interface HealthCheckRequest {
  service: string;
}

interface HealthCheckResposne {
  status: ServingStatus;
}

@Controller()
export class HealthController {
  @GrpcMethod('DefiProviders', 'Check')
  check(data: HealthCheckRequest, metadata: any): HealthCheckResposne {
    return { status: ServingStatus.SERVING };
  }
}