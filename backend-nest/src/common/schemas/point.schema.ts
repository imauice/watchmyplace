import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Point {
  @Prop({ type: String, enum: ['Point'], default: 'Point', required: true })
  type: 'Point';

  @Prop({
    type: [Number],
    required: true,
    validate: {
      validator(value: number[]) {
        return (
          value.length === 2 &&
          value[0] >= -180 &&
          value[0] <= 180 &&
          value[1] >= -90 &&
          value[1] <= 90
        );
      },
      message: 'coordinates must be [longitude, latitude]',
    },
  })
  coordinates: [number, number];
}

export const PointSchema = SchemaFactory.createForClass(Point);
