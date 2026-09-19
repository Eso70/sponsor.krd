import { IsInt, IsNumber, Matches, Max, Min } from 'class-validator';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class SaveCampaignRevenueDto {
  @IsInt()
  @Min(1)
  @Max(9_000_000_000_000)
  advertisementPriceIqd!: number;

  @Matches(DATE_ONLY_PATTERN)
  startDate!: string;

  @Matches(DATE_ONLY_PATTERN)
  endDate!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  campaignSpendUsd!: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  @Max(100_000)
  usdToIqdRate!: number;
}
