import AIReport from './AIReport';

export default function AIOutput({ data, ...props }) {
  return <AIReport response={data} {...props} />;
}
